// Force server-side evaluation on every request — critical so Vercel never
// serves a cached version of this layout that skips the auth/cookie check.
export const dynamic   = "force-dynamic";
export const revalidate = 0;

import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Topbar } from "@/components/layout/Topbar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import type { UserRole } from "@/models/User";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <SidebarProvider>
      <AppSidebar
        role={session.role as UserRole}
        name={session.name ?? ""}
        email={session.email ?? ""}
        image={session.image ?? undefined}
      />
      <SidebarInset>
        <Topbar user={session} />
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
