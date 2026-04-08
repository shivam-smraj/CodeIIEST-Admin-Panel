import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { adminAuth } from "@/lib/firebase-admin";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

// Session duration: 5 days (432000 seconds)
const SESSION_DURATION_SECONDS = 5 * 24 * 60 * 60;

const schema = z.object({
  idToken: z.string().min(1, "ID token is required"),
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken } = schema.parse(body);

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error: any) {
      console.error("[session] ID token verification failed:", error);
      return NextResponse.json(
        { error: "Invalid or expired ID token. Please sign in again." },
        { status: 401 }
      );
    }

    const uid = decodedToken.uid;
    const email = decodedToken.email?.toLowerCase();
    const name = decodedToken.name;
    const picture = decodedToken.picture;
    const signInProvider = decodedToken.firebase?.sign_in_provider;

    // --- Mongoose Sync ---
    if (email) {
      try {
        await connectDB();
        let existingUser = await User.findOne({ email });

        if (existingUser) {
          // If they logged in via Google and don't have a googleId linked yet
          if (signInProvider === "google.com" && !existingUser.googleId) {
            existingUser.googleId = uid;
            if (!existingUser.image && picture) existingUser.image = picture;
            await existingUser.save();
          }
        } else if (signInProvider === "google.com") {
          // If it's a completely new user who signed up via Google Auth
          const isSuperAdmin =
            process.env.INITIAL_SUPERADMIN_EMAIL?.toLowerCase() === email;
            
          await User.create({
            googleId: uid,
            email,
            displayName: name || email.split("@")[0],
            image: picture,
            isEmailVerified: true,
            role: isSuperAdmin ? "superadmin" : "user",
          });
        }
      } catch (dbError) {
        console.error("[session] MongoDB Sync failed:", dbError);
        // Continue to create session even if sync fails
      }
    }

    let sessionCookie: string;
    try {
      sessionCookie = await adminAuth.createSessionCookie(
        idToken,
        { expiresIn: SESSION_DURATION_SECONDS * 1000 }
      );
    } catch (error: any) {
      console.error("[session] Session cookie creation failed:", error);
      return NextResponse.json(
        { error: "Failed to create session. Please try signing in again." },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("__session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION_SECONDS,
      path: "/",
      domain: process.env.AUTH_DOMAIN || undefined,
    });

    return NextResponse.json({ success: true, uid }, { status: 200 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request payload. Missing idToken." },
        { status: 400 }
      );
    }
    console.error("[session] Unexpected error:", err);
    return NextResponse.json(
      { error: "Session creation failed." },
      { status: 500 }
    );
  }
}
