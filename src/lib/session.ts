import { adminAuth } from "@/lib/firebase-admin";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { cookies } from "next/headers";

export interface SessionUser {
  uid:   string;
  email: string;
  name:  string;
  image: string | null;
  role:  string;
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore   = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) {
      console.log("[getSession] No session cookie found");
      return null;
    }

    // Pure cryptographic check — no network call, faster & more reliable in serverless
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
    const email   = decoded.email;
    if (!email) {
      console.log("[getSession] Decoded token has no email");
      return null;
    }

    // Augment with MongoDB user data (role, displayName, etc.)
    await connectDB();
    const dbUser = await User.findOne({ email }).lean() as {
      displayName?: string;
      image?: string;
      role?: string;
    } | null;

    return {
      uid:   decoded.uid,
      email,
      name:  dbUser?.displayName ?? (decoded.name as string | undefined) ?? email.split("@")[0],
      image: dbUser?.image       ?? (decoded.picture as string | undefined) ?? null,
      role:  dbUser?.role        ?? "user",
    };
  } catch (err) {
    // Log the ACTUAL error — critical for Vercel function log diagnostics
    console.error("[getSession] Firebase Verification Error:", err);
    return null;
  }
}

export const SESSION_COOKIE_NAME  = "__session";
export const SESSION_DURATION_SEC = 60 * 60 * 24 * 7; // 7 days
