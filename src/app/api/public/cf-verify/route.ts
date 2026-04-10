import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function verifyToken(req: NextRequest): { uid: string; email: string } | null {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(auth.slice(7), process.env.AUTH_SECRET!) as any;
  } catch {
    return null;
  }
}

/**
 * Generates a deterministic, unique verification code per user.
 * Uses HMAC-SHA256(uid, AUTH_SECRET) — no DB storage needed.
 * The code is always the same for the same user, so repeated calls are fine.
 */
function generateVerifyCode(uid: string): string {
  return (
    "IIEST-" +
    crypto
      .createHmac("sha256", process.env.AUTH_SECRET!)
      .update(uid)
      .digest("hex")
      .slice(0, 8)
      .toUpperCase()
  );
}

/**
 * GET /api/public/cf-verify
 * Returns the unique verification code for this user.
 * Auth: Bearer <cftoken>
 *
 * The user must temporarily set this as their Codeforces "First Name"
 * to prove they own the handle, then call POST to complete verification.
 */
export async function GET(req: NextRequest) {
  const payload = verifyToken(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  const code = generateVerifyCode(payload.uid);
  return NextResponse.json({ code }, { headers: CORS_HEADERS });
}

/**
 * POST /api/public/cf-verify
 * Body: { handle: string }
 * Auth: Bearer <cftoken>
 *
 * 1. Fetches the CF user's profile from the Codeforces API
 * 2. Checks that their firstName field equals the user's verification code
 * 3. If verified, saves the CF handle + rating + avatar to MongoDB
 *
 * This proves the user actually controls the CF account — only the real
 * account owner can change their own firstName on codeforces.com.
 */
export async function POST(req: NextRequest) {
  const payload = verifyToken(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  const { connectDB } = await import("@/lib/db");
  const { User }      = await import("@/models/User");

  try {
    const body   = await req.json();
    const handle = typeof body?.handle === "string" ? body.handle.trim() : "";

    if (!handle || handle.length > 24) {
      return NextResponse.json({ error: "Invalid handle" }, { status: 400, headers: CORS_HEADERS });
    }

    // ── 1. Fetch CF profile via public API ───────────────────────────────────
    // MUST be cache: "no-store" — Next.js would otherwise return a stale cached
    // response from before the user set their firstName, causing false negatives.
    const cfRes = await fetch(
      `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`,
      { cache: "no-store" }
    );

    if (!cfRes.ok) {
      return NextResponse.json({ error: "Codeforces API error" }, { status: 502, headers: CORS_HEADERS });
    }

    const cfData = await cfRes.json() as {
      status:  string;
      result?: {
        handle:     string;
        firstName?: string;
        rating?:    number;
        maxRating?: number;
        rank?:      string;
        titlePhoto?: string;
      }[];
      comment?: string;
    };

    if (cfData.status !== "OK" || !cfData.result?.length) {
      return NextResponse.json(
        { error: cfData.comment || "CF handle not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    const cfUser = cfData.result[0];

    // ── 2. Check the verification code ───────────────────────────────────────
    const expectedCode = generateVerifyCode(payload.uid);
    const actualFirst  = (cfUser.firstName || "").trim();

    // Case-insensitive compare — a user might accidentally type the code in
    // lowercase, and we don't want to punish them for that.
    if (actualFirst.toLowerCase() !== expectedCode.toLowerCase()) {
      return NextResponse.json(
        {
          error:    `Verification code not found in Codeforces First Name. Found: "${actualFirst || "(empty)"}" — expected: "${expectedCode}". Make sure you saved the changes on Codeforces.`,
          expected: expectedCode,
          found:    actualFirst || "(empty)",
        },
        { status: 422, headers: CORS_HEADERS }
      );
    }

    // ── 3. Save to MongoDB ───────────────────────────────────────────────────
    await connectDB();
    await User.findOneAndUpdate(
      { email: payload.email },
      {
        $set: {
          codeforcesId:     cfUser.handle,   // Use canonical casing from CF
          codeforcesRating: cfUser.rating    ?? 0,
          codeforcesAvatar: cfUser.titlePhoto ?? "",
          cfVerifiedAt:     new Date(),
        },
      }
    );

    return NextResponse.json(
      {
        verified:  true,
        handle:    cfUser.handle,
        rating:    cfUser.rating    ?? 0,
        maxRating: cfUser.maxRating ?? 0,
        rank:      cfUser.rank      ?? "unrated",
        avatar:    cfUser.titlePhoto ?? "",
      },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("[public/cf-verify]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500, headers: CORS_HEADERS });
  }
}
