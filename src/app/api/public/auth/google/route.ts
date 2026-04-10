import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import jwt from "jsonwebtoken";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * POST /api/public/auth/google
 * Body: { credential: <Google ID token from GIS> }
 *
 * Verifies the Google ID token server-side (no client_secret needed),
 * upserts the user in MongoDB (only IIEST emails allowed),
 * and returns a signed JWT for subsequent API calls.
 *
 * The GDSC site calls this after the user clicks "Sign in with Google" —
 * Google shows a popup on the GDSC domain, gives us a credential, we
 * exchange it here. The admin panel URL is NEVER visible to the user.
 */
export async function POST(req: NextRequest) {
  try {
    const { credential } = await req.json();
    if (!credential || typeof credential !== "string") {
      return NextResponse.json({ error: "Missing credential" }, { status: 400, headers: CORS_HEADERS });
    }

    // ── 1. Verify ID token via Google's tokeninfo endpoint ──────────────────
    // This is the standard way to verify a Google credential without needing
    // google-auth-library. It validates the signature + expiry server-side.
    const tokenInfoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );

    if (!tokenInfoRes.ok) {
      return NextResponse.json({ error: "Invalid Google token" }, { status: 401, headers: CORS_HEADERS });
    }

    const gUser = await tokenInfoRes.json() as {
      aud: string;
      sub: string;
      email: string;
      email_verified: string;
      name: string;
      picture: string;
      error_description?: string;
    };

    if (gUser.error_description) {
      return NextResponse.json({ error: "Token verification failed" }, { status: 401, headers: CORS_HEADERS });
    }

    // Verify the token was issued for OUR client
    if (gUser.aud !== process.env.GOOGLE_CLIENT_ID) {
      return NextResponse.json({ error: "Token audience mismatch" }, { status: 401, headers: CORS_HEADERS });
    }

    if (gUser.email_verified !== "true") {
      return NextResponse.json({ error: "Email not verified with Google" }, { status: 401, headers: CORS_HEADERS });
    }

    const email = gUser.email.toLowerCase();

    // ── 2. IIEST email gate ───────────────────────────────────────────────────
    if (!email.endsWith("@students.iiests.ac.in") && !email.endsWith(".iiests.ac.in")) {
      return NextResponse.json(
        { error: "Only IIEST Shibpur college email addresses are allowed." },
        { status: 403, headers: CORS_HEADERS }
      );
    }

    // ── 3. Derive roll/year from email prefix ─────────────────────────────────
    // e.g. "2024eeb109.shivam@students.iiests.ac.in"
    //       ↑ first 10 chars = roll number, first 4 = year
    const derivedRoll  = email.substring(0, 10).toUpperCase();
    const derivedYear  = parseInt(email.substring(0, 4), 10);

    // Clean up the display name from Google (remove roll prefix if present)
    let finalName = gUser.name || email.split("@")[0];
    if (finalName.toUpperCase().startsWith(derivedRoll)) {
      finalName = finalName.substring(derivedRoll.length).trim();
    }
    finalName = finalName
      .replace(/_/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

    // ── 4. Upsert user in MongoDB ─────────────────────────────────────────────
    await connectDB();
    let dbUser = await User.findOne({ email });

    if (dbUser) {
      let changed = false;
      if (!dbUser.googleId)  { dbUser.googleId = gUser.sub;       changed = true; }
      if (!dbUser.image && gUser.picture) { dbUser.image = gUser.picture; changed = true; }
      if (!dbUser.enrollmentNo) {
        dbUser.enrollmentNo = derivedRoll;
        if (!isNaN(derivedYear)) dbUser.enrollmentYear = derivedYear;
        changed = true;
      }
      if (changed) await dbUser.save();
    } else {
      const isSuperAdmin =
        process.env.INITIAL_SUPERADMIN_EMAIL?.toLowerCase() === email;
      dbUser = await User.create({
        googleId:       gUser.sub,
        email,
        displayName:    finalName,
        enrollmentNo:   derivedRoll,
        enrollmentYear: !isNaN(derivedYear) ? derivedYear : undefined,
        image:          gUser.picture || undefined,
        isEmailVerified: true,
        role:           isSuperAdmin ? "superadmin" : "user",
      });
    }

    // ── 5. Issue our own JWT ──────────────────────────────────────────────────
    const token = jwt.sign(
      {
        uid:          (dbUser._id as any).toString(),
        email:        dbUser.email,
        name:         dbUser.displayName,
        enrollmentNo: dbUser.enrollmentNo,
        role:         dbUser.role,
      },
      process.env.AUTH_SECRET!,
      { expiresIn: "7d" }
    );

    return NextResponse.json({ token, name: dbUser.displayName }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("[public/auth/google]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500, headers: CORS_HEADERS });
  }
}
