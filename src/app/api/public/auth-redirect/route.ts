import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import jwt from "jsonwebtoken";

// Allowed origins that can receive the cftoken redirect
const ALLOWED_RETURN_ORIGINS = [
  "https://codeiiest-testing.vercel.app",
  "https://codeiiest.vercel.app",
  "http://localhost:3001",
];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/public/auth-redirect?return=<gdsc-site-url>
 *
 * Called after a successful Google sign-in on the admin panel.
 * Creates a short-lived JWT containing the user's public profile and
 * redirects the browser back to the GDSC site with ?cftoken=<JWT>.
 *
 * The GDSC site is a pure Vite SPA with no server — it cannot hold
 * NextAuth sessions. This endpoint bridges the two apps.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();

  if (!session) {
    // Not logged in — send back to login with the full redirect chain preserved
    const returnUrl = req.nextUrl.searchParams.get("return") || "";
    const loginUrl = new URL("/login", process.env.AUTH_URL);
    if (returnUrl) loginUrl.searchParams.set("callbackUrl",
      `${process.env.AUTH_URL}/api/public/auth-redirect?return=${encodeURIComponent(returnUrl)}`
    );
    return NextResponse.redirect(loginUrl);
  }

  const rawReturn = req.nextUrl.searchParams.get("return") || "";

  // Validate the return URL is an allowed origin (prevent open redirect)
  let returnUrl: URL | null = null;
  try {
    returnUrl = new URL(rawReturn);
    const isAllowed = ALLOWED_RETURN_ORIGINS.some(
      (origin) => returnUrl!.origin === origin
    );
    if (!isAllowed) {
      console.warn("[auth-redirect] Blocked return origin:", returnUrl.origin);
      returnUrl = new URL("https://codeiiest-testing.vercel.app");
    }
  } catch {
    returnUrl = new URL("https://codeiiest-testing.vercel.app");
  }

  try {
    await connectDB();
    const user = await User.findOne({ email: session.email })
      .select("displayName email enrollmentNo enrollmentYear role codeforcesId codeforcesRating codeforcesAvatar cfVerifiedAt")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 1-day token — long enough to not annoy the user, short enough to be safe
    const token = jwt.sign(
      {
        uid:          (user._id as any).toString(),
        email:        user.email,
        name:         user.displayName,
        enrollmentNo: user.enrollmentNo,
        role:         user.role,
      },
      process.env.AUTH_SECRET!,
      { expiresIn: "1d" }
    );

    returnUrl.searchParams.set("cftoken", token);
    return NextResponse.redirect(returnUrl.toString());
  } catch (err) {
    console.error("[auth-redirect] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
