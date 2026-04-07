/**
 * auth.ts — Full NextAuth configuration for Node.js runtime.
 *
 * Extends authConfig (Edge-safe base) with providers that use
 * Node.js APIs (mongoose, bcryptjs). Used ONLY in:
 *   - Server Components (await auth())
 *   - API Routes        (handlers)
 *   - Server Actions    (signIn, signOut)
 *
 * Never imported by middleware.ts.
 */
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import type { UserRole } from "@/models/User";
import { authConfig } from "@/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,

  providers: [
    Google({
      clientId:     process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),

    Credentials({
      name: "Email & Password",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          await connectDB();
          const user = await User.findOne({
            email: (credentials.email as string).toLowerCase(),
          });
          if (!user || !user.passwordHash) return null;

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          );
          if (!isValid) return null;

          return {
            id:    user._id.toString(),
            email: user.email,
            name:  user.displayName,
            image: user.image ?? null,
            role:  user.role,
          };
        } catch (err) {
          // Log so it appears in Vercel function logs for debugging
          console.error("[authorize] DB error:", err);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    // NOTE: do NOT spread authConfig.callbacks here.
    // The `authorized` callback is for the Edge middleware only.
    // Including it in the full Node.js config can interfere with sign-in.

    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        await connectDB();
        const email = profile?.email as string | undefined;
        if (!email) return false;
        if (!isCollegeEmail(email)) return false;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
          if (!existingUser.googleId) {
            existingUser.googleId = profile?.sub ?? undefined;
            existingUser.image    = typeof profile?.picture === "string"
              ? profile.picture : undefined;
            await existingUser.save();
          }
          user.id   = existingUser._id.toString();
          user.role = existingUser.role;
        } else {
          const isSuperAdmin =
            process.env.INITIAL_SUPERADMIN_EMAIL?.toLowerCase() === email.toLowerCase();

          const newUser = await User.create({
            googleId:        profile?.sub ?? undefined,
            email,
            displayName:     (profile?.name as string | undefined) ?? email.split("@")[0],
            image:           typeof profile?.picture === "string" ? profile.picture : undefined,
            isEmailVerified: true,
            role:            isSuperAdmin ? "superadmin" : "user",
          });
          user.id   = newUser._id.toString();
          user.role = newUser.role;
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      // Only runs on initial sign-in — persists id and role into the JWT
      if (user) {
        token.id   = user.id ?? "";
        token.role = (user as { role?: UserRole }).role ?? "user";
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id   = token.id   as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },

  session: { strategy: "jwt" },
});

export function isCollegeEmail(email: string): boolean {
  return (
    email.endsWith("@students.iiests.ac.in") ||
    email.endsWith(".iiests.ac.in")
  );
}
