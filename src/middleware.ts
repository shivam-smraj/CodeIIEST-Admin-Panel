/**
 * middleware.ts — Edge Runtime route protection.
 *
 * ONLY imports from auth.config (Edge-safe, no Node.js).
 * Uses a separate NextAuth instance that knows nothing about
 * mongoose/bcrypt — it only verifies the JWT from the session cookie.
 * JWT signing key = AUTH_SECRET environment variable (same as auth.ts).
 */
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const { auth: middleware } = NextAuth(authConfig);
export default middleware;

export const config = {
  matcher: [
    // Run on every route EXCEPT Next.js internals and the auth/public APIs
    "/((?!_next/static|_next/image|favicon\\.ico|api/auth|api/public).*)",
  ],
};
