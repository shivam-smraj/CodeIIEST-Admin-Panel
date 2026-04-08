import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import type { IUser } from "@/models/User";

export type SessionUser = {
  uid: string;
  email: string;
  name: string;
  image: string | null;
  role: string;
};

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;
    if (!sessionCookie) return null;

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    await connectDB();
    const user = await User.findOne({ email: decoded.email?.toLowerCase() }).lean<IUser>();
    
    if (!user) {
      console.warn(`[session] User found in Firebase but missing in MongoDB: ${decoded.email}`);
      return null;
    }

    return {
      uid: decoded.uid,
      email: user.email,
      name: user.displayName,
      image: user.image || null,
      role: user.role,
    };
  } catch (error) {
    if ((error as any).code === 'auth/session-cookie-expired' || (error as any).code === 'auth/session-cookie-revoked') {
       return null;
    }
    console.error("[getSession] Session verification error:", error);
    return null;
  }
}
