"use client";

import { signOut } from "next-auth/react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";   
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/session";
import { CodeiiestLogo } from "@/components/ui/codeiiest-logo";

interface TopbarProps {
  user: SessionUser;
}

/** Maps route prefixes -> human-readable page titles */
function usePageTitle(): string {
  const pathname = usePathname();
  const routes: [string, string][] = [
    ["/superadmin/users", "All Users"],
    ["/superadmin/logs",  "Audit Logs"],
    ["/admin/events",     "Events"],
    ["/cf-verify",        "Verify CF Handle"],
    ["/dashboard",        "Dashboard"],
    ["/profile",          "My Profile"],
    ["/settings",         "Settings"],
  ];
  for (const [prefix, title] of routes) {
    if (pathname.startsWith(prefix)) return title;
  }
  return "CodeIIEST Admin";
}

export function Topbar({ user }: TopbarProps) {
  const pageTitle = usePageTitle();

  return (
    <header className="flex h-14 items-center gap-3 border-b border-border/50 px-4 bg-background/60 backdrop-blur-sm sticky top-0 z-10">
      {/* Hamburger -> always visible, collapses on desktop when sidebar is pinned */}
      <SidebarTrigger className="-ml-1 shrink-0" />
      <Separator orientation="vertical" className="h-4 shrink-0" />

      {/* Logo shown only when sidebar is hidden (mobile) */}
      <div className="flex items-center gap-2 md:hidden">
        <CodeiiestLogo size={22} />
      </div>

      {/* Page title -> hidden on very small screens to save space */}
      <span className="hidden sm:block text-sm font-semibold text-white/80 truncate">
        {pageTitle}
      </span>

      <div className="flex-1" />

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none">
          <Avatar className="w-8 h-8 border border-border hover:border-indigo-500/50 transition-colors cursor-pointer">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback className="bg-indigo-600/20 text-indigo-300 text-xs font-bold">
              {(user.name ?? "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <div className="px-2 py-1.5">
            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Link href="/profile" className="flex items-center gap-2 w-full">   
              <User className="w-4 h-4" /> Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href="/settings" className="flex items-center gap-2 w-full">  
              <Settings className="w-4 h-4" /> Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 text-red-400 focus:text-red-400 cursor-pointer"    
            onClick={async () => {
              try {
                await signOut({ callbackUrl: "/login" });
              } catch (error) {
                console.error("Logout failed:", error);
              }
            }}
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
