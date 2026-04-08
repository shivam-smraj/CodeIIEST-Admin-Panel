import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Lightweight check — does the session cookie exist?
  // Full verification and role-checks happen in layout.tsx via server components.
  const hasSession = req.cookies.has("__session");

  const isProtectedRoute = 
    pathname.startsWith("/superadmin") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/cf-verify");

  if (isProtectedRoute && !hasSession) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ── Redirect logged-in users away from auth pages ────────────────────────
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
