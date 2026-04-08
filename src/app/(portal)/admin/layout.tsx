import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Allow both admin and superadmin to access admin routes
  if (session.role !== "admin" && session.role !== "superadmin") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
