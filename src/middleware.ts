/**
 * Next.js Edge Middleware — Route Protection
 *
 * Uses the canonical NextAuth v5 pattern: `auth` is called as a middleware
 * wrapper so it reads the SAME session cookie it writes during sign-in.
 * Any other import pattern (e.g. importing from "next-auth/middleware")
 * risks cookie name / secret mismatches.
 */
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PROTECTED = ["/dashboard", "/profile", "/settings", "/cf-verify", "/admin", "/superadmin"];
const AUTH_ONLY = ["/login", "/register", "/forgot-password"];

// auth() wraps our handler and injects req.auth (Session | null)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default auth(function middleware(req: any) {
  const { pathname } = req.nextUrl;
  const isLoggedIn   = !!req.auth;

  // Already logged in → bounce away from auth pages
  if (isLoggedIn && AUTH_ONLY.some(r => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  // Not logged in → redirect to login
  if (!isLoggedIn && PROTECTED.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Run on all routes except Next.js internals and the auth API itself
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|api/auth|api/public).*)"],
};
