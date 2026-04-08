import { adminAuth } from "@/lib/firebase-admin";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, SESSION_DURATION_SEC } from "@/lib/session";

const EXPIRES_IN_MS = SESSION_DURATION_SEC * 1000;

/**
 * POST /api/auth/session
 * Body: { idToken: string }
 *
 * Verifies the Firebase ID token, ensures the user exists in MongoDB
 * (creating them if needed for Google sign-ins), then sets an
 * HTTP-only session cookie via Firebase Admin's createSessionCookie.
 */
export async function POST(req: Request) {
  try {
    const { idToken } = (await req.json()) as { idToken: string };
    if (!idToken) return NextResponse.json({ error: "Missing idToken" }, { status: 400 });

    // Verify the ID token is fresh (issued in the last 5 min) to prevent replay
    const decoded = await adminAuth.verifyIdToken(idToken, true);

    await connectDB();

    // Upsert user in MongoDB so we always have a record
    let dbUser = await User.findOne({ email: decoded.email });
    if (!dbUser) {
      const isSuperAdmin =
        process.env.INITIAL_SUPERADMIN_EMAIL?.toLowerCase() === decoded.email?.toLowerCase();
      dbUser = await User.create({
        email:           decoded.email,
        displayName:     decoded.name ?? decoded.email?.split("@")[0] ?? "User",
        image:           decoded.picture ?? undefined,
        isEmailVerified: decoded.email_verified ?? false,
        role:            isSuperAdmin ? "superadmin" : "user",
        googleId:        decoded.firebase?.sign_in_provider === "google.com" ? decoded.uid : undefined,
      });
    } else if (!dbUser.googleId && decoded.firebase?.sign_in_provider === "google.com") {
      // Link Google UID to existing account
      dbUser.googleId = decoded.uid;
      if (!dbUser.image && decoded.picture) dbUser.image = decoded.picture;
      await dbUser.save();
    }

    // Create long-lived session cookie (7 days)
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: EXPIRES_IN_MS });

    const isProd = process.env.NODE_ENV === "production";
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge:   SESSION_DURATION_SEC,
      httpOnly: true,
      secure:   isProd,
      path:     "/",
      sameSite: "lax",
    });

    return NextResponse.json({ success: true, role: dbUser.role });
  } catch (err) {
    console.error("[session/POST]", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/**
 * DELETE /api/auth/session
 * Clears the session cookie (logout).
 */
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ success: true });
}
