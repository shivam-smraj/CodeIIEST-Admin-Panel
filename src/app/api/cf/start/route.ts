import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/login", process.env.AUTH_URL));

  // Generate a random nonce to prevent CSRF/replay attacks
  const nonce = crypto.randomBytes(16).toString("hex");

  // Store nonce in an httpOnly cookie (valid 5 minutes)
  const cookieStore = await cookies();
  cookieStore.set("cf_oauth_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300, // 5 minutes
    path: "/",
  });

  const params = new URLSearchParams({
    client_id:    process.env.CF_CLIENT_ID!,
    redirect_uri: process.env.CF_REDIRECT_URI!,
    response_type: "code",
    scope:        "openid profile",
    nonce,
  });

  return NextResponse.redirect(
    `https://codeforces.com/oauth/authorize?${params.toString()}`
  );
}
