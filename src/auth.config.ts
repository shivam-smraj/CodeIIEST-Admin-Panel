/**
 * auth.config.ts — Edge-Runtime-safe NextAuth configuration.
 *
 * This file MUST NOT import anything that uses Node.js APIs:
 *   ✗ mongoose / mongodb driver
 *   ✗ bcryptjs  (uses Node crypto)
 *   ✗ Any model from @/models/*
 *   ✗ @/lib/db
 *
 * It is imported by middleware.ts (Edge Runtime) and by auth.ts (Node.js).
 * The `authorized` callback here is the sole route-guard for the middleware.
 */
import type { NextAuthConfig } from "next-auth";

const PROTECTED = [
  "/dashboard", "/profile", "/settings",
  "/cf-verify", "/admin", "/superadmin",
];
const AUTH_ONLY = ["/login", "/register", "/forgot-password"];

export const authConfig: NextAuthConfig = {
  trustHost: true,

  // Providers are added in auth.ts — empty here keeps this file Edge-safe
  providers: [],

  pages: {
    signIn: "/login",
    error:  "/login",
  },

  callbacks: {
    authorized({ auth, request }) {
      const pathname   = request.nextUrl.pathname;
      const isLoggedIn = !!auth?.user;

      // Logged-in users hitting auth pages → send to dashboard
      if (isLoggedIn && AUTH_ONLY.some(r => pathname.startsWith(r))) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      // Unauthenticated users hitting protected pages → send to login
      if (!isLoggedIn && PROTECTED.some(p => pathname.startsWith(p))) {
        return Response.redirect(new URL("/login", request.nextUrl));
      }

      // Everything else is allowed
      return true;
    },
  },
};
