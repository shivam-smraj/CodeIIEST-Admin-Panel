import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { cookies } from "next/headers";
import crypto from "crypto";

const ALLOWED_RETURN_ORIGINS = [
  "https://codeiiest-testing.vercel.app",
  "https://codeiiest.vercel.app",
  "http://localhost:3001",
];

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/login", process.env.AUTH_URL));

  // Generate a random nonce to prevent CSRF/replay attacks
  const nonce = crypto.randomBytes(16).toString("hex");

  const cookieStore = await cookies();

  // Store nonce in an httpOnly cookie (valid 5 minutes)
  cookieStore.set("cf_oauth_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300, // 5 minutes
    path: "/",
  });

  // Optionally store a return_url so the callback can redirect to GDSC site
  const rawReturn = req.nextUrl.searchParams.get("return_url") || "";
  if (rawReturn) {
    try {
      const returnUrl = new URL(rawReturn);
      const isAllowed = ALLOWED_RETURN_ORIGINS.some((o) => returnUrl.origin === o);
      if (isAllowed) {
        cookieStore.set("cf_return_url", rawReturn, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 300, // 5 minutes
          path: "/",
        });
      }
    } catch {
      // Invalid URL — ignore, callback will default to admin dashboard
    }
  }

  const params = new URLSearchParams({
    client_id:     process.env.CF_CLIENT_ID!,
    redirect_uri:  process.env.CF_REDIRECT_URI!,
    response_type: "code",
    scope:         "openid profile",
    nonce,
  });

  return NextResponse.redirect(
    `https://codeforces.com/oauth/authorize?${params.toString()}`
  );
}
