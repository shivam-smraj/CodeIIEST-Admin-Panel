import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import jwt from "jsonwebtoken";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function verifyToken(req: NextRequest): { email: string; uid: string } | null {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  try {
    return jwt.verify(token, process.env.AUTH_SECRET!) as any;
  } catch {
    return null;
  }
}

/**
 * GET /api/public/me
 * Returns the current user's full public profile from MongoDB.
 * Auth: Bearer <cftoken> (the JWT issued by /api/public/auth-redirect)
 */
export async function GET(req: NextRequest) {
  const payload = verifyToken(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  try {
    await connectDB();
    const user = await User.findOne({ email: payload.email })
      .select("displayName email enrollmentNo enrollmentYear role codeforcesId codeforcesRating codeforcesAvatar cfVerifiedAt image")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404, headers: CORS_HEADERS });
    }

    return NextResponse.json({
      name:             user.displayName,
      email:            user.email,
      enrollmentNo:     user.enrollmentNo    ?? null,
      enrollmentYear:   user.enrollmentYear  ?? null,
      role:             user.role,
      image:            user.image           ?? null,
      codeforcesId:     user.codeforcesId    ?? null,
      codeforcesRating: user.codeforcesRating ?? null,
      codeforcesAvatar: user.codeforcesAvatar ?? null,
      cfVerifiedAt:     user.cfVerifiedAt    ?? null,
    }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("[public/me GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500, headers: CORS_HEADERS });
  }
}

/**
 * PATCH /api/public/me
 * Allows a GDSC-site user to update their display name and/or CF handle.
 * Auth: Bearer <cftoken>
 * Body: { name?: string, codeforcesId?: string, codeforcesRating?: number, codeforcesAvatar?: string }
 */
export async function PATCH(req: NextRequest) {
  const payload = verifyToken(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();
    const updates: Record<string, unknown> = {};

    // Name update
    if (body.name !== undefined) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (name.length < 2 || name.length > 60) {
        return NextResponse.json({ error: "Name must be 2–60 characters" }, { status: 400, headers: CORS_HEADERS });
      }
      updates.displayName = name;
    }

    // CF handle update (from GDSC site after user confirms their handle)
    if (body.codeforcesId !== undefined) {
      const handle = typeof body.codeforcesId === "string" ? body.codeforcesId.trim() : "";
      if (handle.length < 1 || handle.length > 24) {
        return NextResponse.json({ error: "Invalid CF handle" }, { status: 400, headers: CORS_HEADERS });
      }
      updates.codeforcesId     = handle;
      updates.cfVerifiedAt     = new Date();
      if (typeof body.codeforcesRating === "number") updates.codeforcesRating = body.codeforcesRating;
      if (typeof body.codeforcesAvatar === "string") updates.codeforcesAvatar = body.codeforcesAvatar;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400, headers: CORS_HEADERS });
    }

    await connectDB();
    const user = await User.findOneAndUpdate(
      { email: payload.email },
      { $set: updates },
      { new: true }
    ).select("displayName codeforcesId codeforcesRating codeforcesAvatar cfVerifiedAt").lean();

    return NextResponse.json({
      name:             user?.displayName,
      codeforcesId:     user?.codeforcesId     ?? null,
      codeforcesRating: user?.codeforcesRating  ?? null,
      codeforcesAvatar: user?.codeforcesAvatar  ?? null,
      cfVerifiedAt:     user?.cfVerifiedAt      ?? null,
    }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("[public/me PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500, headers: CORS_HEADERS });
  }
}
