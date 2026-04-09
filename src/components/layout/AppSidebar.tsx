"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";   
import { Badge } from "@/components/ui/badge";
import { CodeiiestLogo } from "@/components/ui/codeiiest-logo";
import {
  LayoutDashboard, User, Code2, Settings, Shield,
  CalendarDays, Users, ScrollText, ChevronRight, LogOut
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/models/User";

const userNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/profile",   icon: User,            label: "My Profile" },
  { href: "/cf-verify", icon: Code2,           label: "Verify CF Handle" },     
  { href: "/settings",  icon: Settings,        label: "Settings" },
];

const adminNav = [
  { href: "/admin/events", icon: CalendarDays, label: "Events" },
];


const superAdminNav = [
  { href: "/superadmin/users", icon: Users,      label: "All Users" },
  { href: "/superadmin/logs",  icon: ScrollText, label: "Audit Logs" },
];

const roleBadge: Record<UserRole, { label: string; className: string }> = {     
  user:       { label: "User",       className: "border-border text-muted-foreground" },
  admin:      { label: "Admin",      className: "border-blue-500/40 text-blue-400" },
  superadmin: { label: "Superadmin", className: "border-indigo-500/40 text-indigo-400" },
  alumni:     { label: "Alumni",     className: "border-amber-500/40 text-amber-400" },
};

interface AppSidebarProps {
  role: UserRole;
  name: string;
  email: string;
  image?: string;
}

export function AppSidebar({ role, name, email, image }: AppSidebarProps) {     
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();

  async function handleLogout() {
    try {
      await signOut({ callbackUrl: "/login" });
    } catch (e) {
      console.error(e);
    }
  }

  function NavItem({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
    const active = pathname === href || pathname.startsWith(href + "/");        
    return (
      <SidebarMenuItem>
        <SidebarMenuButton isActive={active} className="gap-3" onClick={() => { if (typeof window !== "undefined" && window.innerWidth < 768) setOpenMobile(false); }}>
          <Link href={href} className="flex items-center w-full gap-3">
            <Icon className="w-4 h-4" />
            <span>{label}</span>
            {active && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}   
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  const badge = roleBadge[role];

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="py-4">
        <div className="flex items-center gap-2.5 px-2">
          <CodeiiestLogo size={30} />
          <div>
            <p className="text-sm font-bold text-white leading-none">CodeIIEST</p>
            <p className="text-[10px] text-muted-foreground">Admin Portal</p>   
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Portal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userNav.map((item) => <NavItem key={item.href} {...item} />)}    
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(role === "admin" || role === "superadmin") && (
          <SidebarGroup>
            <SidebarGroupLabel>Content Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNav.map((item) => <NavItem key={item.href} {...item} />)} 
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {role === "superadmin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Super Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {superAdminNav.map((item) => <NavItem key={item.href} {...item} />)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="py-3">
        <div className="flex items-center gap-2 px-2">
          <Avatar className="w-8 h-8 border border-border">
            <AvatarImage src={image} />
            <AvatarFallback className="bg-indigo-600/20 text-indigo-300 text-xs font-bold">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{name}</p> 
            <p className="text-[10px] text-muted-foreground truncate">{email}</p>
          </div>
          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${badge.className}`}>
            {badge.label}
          </Badge>
        </div>
        <SidebarMenu className="mt-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              className="gap-3 text-red-500 hover:text-red-400 hover:bg-red-500/10"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
