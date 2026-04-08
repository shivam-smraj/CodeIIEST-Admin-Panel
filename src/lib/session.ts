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

/**
 * Reads the __session cookie, verifies it with Firebase Admin,
 * then augments with role/profile data from MongoDB.
 * Returns null if not authenticated.
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore  = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;
    if (!sessionCookie) return null;

    // Verify the Firebase session cookie (checks revocation too)
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const email   = decoded.email;
    if (!email) return null;

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
  } catch {
    return null;
  }
}

/**
 * Name of the HTTP-only session cookie.
 */
export const SESSION_COOKIE_NAME = "__session";

/**
 * Session cookie max-age in seconds (7 days).
 */
export const SESSION_DURATION_SEC = 60 * 60 * 24 * 7;
