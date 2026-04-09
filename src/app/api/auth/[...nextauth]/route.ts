import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 5 * 24 * 60 * 60, // 5 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return false;

      const email = user.email?.toLowerCase();
      if (!email) return false;

      try {
        await connectDB();
        let existingUser = await User.findOne({ email });

        const derivedRoll = email.substring(0, 10).toUpperCase();
        const derivedYearStr = email.substring(0, 4);
        const derivedYear = parseInt(derivedYearStr, 10);

        let finalName = user.name || email.split("@")[0];
        if (finalName.toUpperCase().startsWith(derivedRoll)) {
          finalName = finalName.substring(derivedRoll.length).trim();
        }
        finalName = finalName
          .replace(/_/g, " ")
          .split(" ")
          .filter(Boolean)
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");

        if (existingUser) {
          let updated = false;
          if (!existingUser.googleId) {
            existingUser.googleId = user.id;
            if (!existingUser.image && user.image) existingUser.image = user.image;
            updated = true;
          }
          if (!existingUser.enrollmentNo) {
            existingUser.enrollmentNo = derivedRoll;
            if (!isNaN(derivedYear)) existingUser.enrollmentYear = derivedYear;
            if (!existingUser.displayName || existingUser.displayName === email.split("@")[0]) {
              existingUser.displayName = finalName;
            }
            updated = true;
          }
          if (updated) await existingUser.save();

          // Mutate the user object so the JWT callback gets the MongoDB IDs
          (user as any).role = existingUser.role;
          (user as any).uid = existingUser._id.toString();
          user.name = existingUser.displayName;
          (user as any).enrollmentNo = existingUser.enrollmentNo;
        } else {
          const isSuperAdmin = process.env.INITIAL_SUPERADMIN_EMAIL?.toLowerCase() === email;

          const newUser = await User.create({
            googleId: user.id,
            email,
            displayName: finalName,
            enrollmentNo: derivedRoll,
            ...(!isNaN(derivedYear) ? { enrollmentYear: derivedYear } : {}),
            image: user.image || undefined,
            isEmailVerified: true,
            role: isSuperAdmin ? "superadmin" : "user",
          });

          (user as any).role = newUser.role;
          (user as any).uid = newUser._id.toString();
          user.name = newUser.displayName;
          (user as any).enrollmentNo = newUser.enrollmentNo;
        }

        return true;
      } catch (error) {
        console.error("[NextAuth] Error during signIn sync:", error);
        return false;
      }
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.uid = (user as any).uid || user.id;
        token.role = (user as any).role || "user";
        token.enrollmentNo = (user as any).enrollmentNo;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session as any).uid = token.uid;
        (session as any).role = token.role;
        (session as any).enrollmentNo = token.enrollmentNo;
        
        // Match the legacy getSession return shape
        (session as any).name = session.user.name;
        (session as any).email = session.user.email;
        (session as any).image = session.user.image || null;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
