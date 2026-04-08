import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Only allow superadmin to access superadmin routes
  if (session.role !== "superadmin") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
