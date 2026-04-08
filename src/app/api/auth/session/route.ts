import { adminAuth } from "@/lib/firebase-admin";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, SESSION_DURATION_SEC } from "@/lib/session";

const EXPIRES_IN_MS = SESSION_DURATION_SEC * 1000;

export async function POST(req: Request) {
  try {
    const { idToken } = (await req.json()) as { idToken: string };
    if (!idToken) return NextResponse.json({ error: "Missing idToken" }, { status: 400 });

    // Verify the Firebase ID token
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    console.log("[session/POST] Token verified for:", decoded.email);

    await connectDB();

    // Upsert user in MongoDB
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
      dbUser.googleId = decoded.uid;
      if (!dbUser.image && decoded.picture) dbUser.image = decoded.picture;
      await dbUser.save();
    }

    // Create long-lived Firebase session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: EXPIRES_IN_MS });
    console.log("[session/POST] Session cookie created, setting cookie...");

    // Use cookies() from next/headers — the officially recommended way per Next.js docs
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge:   SESSION_DURATION_SEC,
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      path:     "/",
      sameSite: "lax",
    });

    console.log("[session/POST] Cookie set successfully");
    return NextResponse.json({ success: true, role: dbUser.role });
  } catch (err) {
    console.error("[session/POST] Error:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ success: true });
}
