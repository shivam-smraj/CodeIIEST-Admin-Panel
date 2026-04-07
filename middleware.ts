import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Lightweight JWT decode — no DB call, works on edge runtime
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET!,
  });

  const role = token?.role as string | undefined;

  // ── Superadmin-only routes ───────────────────────────────────────────────
  if (pathname.startsWith("/superadmin")) {
    if (!token || role !== "superadmin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // ── Admin + Superadmin routes ────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!token || (role !== "admin" && role !== "superadmin")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // ── Authenticated users only ─────────────────────────────────────────────
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/cf-verify")
  ) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // ── Redirect logged-in users away from auth pages ────────────────────────
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
