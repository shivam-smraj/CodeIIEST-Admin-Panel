import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export type SessionUser = {
  uid: string;
  email: string;
  name: string;
  image: string | null;
  role: string;
  enrollmentNo?: string;
};

export async function getSession(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return null;
  }

  return {
    uid: (session as any).uid || "",
    email: session.user.email || "",
    name: session.user.name || "",
    image: session.user.image || null,
    role: (session as any).role || "user",
    enrollmentNo: (session as any).enrollmentNo,
  };
}
