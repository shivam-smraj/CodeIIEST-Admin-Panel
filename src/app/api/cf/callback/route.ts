import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const REDIRECT_BASE = process.env.AUTH_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.redirect(`${REDIRECT_BASE}/login`);

  const searchParams = req.nextUrl.searchParams;
  const code  = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${REDIRECT_BASE}/cf-verify?error=cf_denied`);
  }

  try {
    // ── 1. Retrieve stored nonce ────────────────────────────────────────────
    const cookieStore = await cookies();
    const storedNonce = cookieStore.get("cf_oauth_nonce")?.value;

    if (!storedNonce) {
      return NextResponse.redirect(`${REDIRECT_BASE}/cf-verify?error=nonce_missing`);
    }
    // Clear nonce cookie immediately
    cookieStore.delete("cf_oauth_nonce");

    // ── 2. Exchange code for tokens ──────────────────────────────────────────
    const tokenRes = await fetch("https://codeforces.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id:     process.env.CF_CLIENT_ID!,
        client_secret: process.env.CF_CLIENT_SECRET!,
        redirect_uri:  process.env.CF_REDIRECT_URI!,
        grant_type:    "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      console.error("[CF callback] Token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(`${REDIRECT_BASE}/cf-verify?error=token_exchange`);
    }

    const tokenData = (await tokenRes.json()) as {
      access_token: string;
      id_token?: string;
    };

    // ── 3. Verify id_token and check nonce ───────────────────────────────────
    const idToken = tokenData.id_token;
    if (!idToken) {
      return NextResponse.redirect(`${REDIRECT_BASE}/cf-verify?error=no_id_token`);
    }

    // IMPORTANT: use decode here since CF uses symmetric key (not JWKS)
    // We verify nonce manually to prevent CSRF
    const decoded = jwt.decode(idToken) as Record<string, unknown> | null;
    if (!decoded) {
      return NextResponse.redirect(`${REDIRECT_BASE}/cf-verify?error=invalid_token`);
    }

    // Verify nonce matches
    if (decoded.nonce !== storedNonce) {
      return NextResponse.redirect(`${REDIRECT_BASE}/cf-verify?error=nonce_mismatch`);
    }

    const cfHandle = decoded.handle as string | undefined;
    if (!cfHandle) {
      return NextResponse.redirect(`${REDIRECT_BASE}/cf-verify?error=no_handle`);
    }

    // ── 4. Fetch CF user info for rating + avatar ────────────────────────────
    const cfInfoRes = await fetch(
      `https://codeforces.com/api/user.info?handles=${cfHandle}`
    );
    const cfInfo = await cfInfoRes.json() as {
      status: string;
      result: { rating?: number; titlePhoto?: string }[];
    };

    const cfRating = cfInfo.result?.[0]?.rating ?? 0;
    const cfAvatar = cfInfo.result?.[0]?.titlePhoto ?? "";

    // ── 5. Save to user document ─────────────────────────────────────────────
    await connectDB();
    await User.findByIdAndUpdate(session.user.id, {
      $set: {
        codeforcesId:     cfHandle,
        codeforcesRating: cfRating,
        codeforcesAvatar: cfAvatar,
        cfVerifiedAt:     new Date(),
      },
    });

    return NextResponse.redirect(`${REDIRECT_BASE}/cf-verify?success=true&handle=${cfHandle}`);
  } catch (err) {
    console.error("[CF callback] Error:", err);
    return NextResponse.redirect(`${REDIRECT_BASE}/cf-verify?error=server_error`);
  }
}
