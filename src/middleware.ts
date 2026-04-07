import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/profile",
  "/settings",
  "/cf-verify",
  "/admin",
  "/superadmin",
];

// Routes that should redirect to /dashboard if already logged in
const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

export default auth((req: NextRequest & { auth: unknown }) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public API routes (no auth needed)
     * - api/auth (NextAuth itself)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/public).*)",
  ],
};
