import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600", // 5-min CDN cache
};

// Handle preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/public/leaderboard
 * Returns all users who have verified their CF handle.
 * Shape: { handle, name, enrollmentYear }[]
 * No sensitive data — no email, no password, no role.
 */
export async function GET(_req: NextRequest) {
  try {
    await connectDB();
    const users = await User.find(
      { codeforcesId: { $exists: true, $nin: [null, ""] } },
      { codeforcesId: 1, displayName: 1, enrollmentYear: 1, _id: 0 }
    ).lean();

    const leaderboard = users.map((u) => ({
      handle: u.codeforcesId,
      name: u.displayName,
      // enrollmentYear is the year they joined (e.g., 2022)
      // The GDSC site's calculateTopCoders uses `year` = enrollmentYear + 4 (graduation year)
      year: u.enrollmentYear ? u.enrollmentYear + 4 : null,
    }));

    return NextResponse.json(leaderboard, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("[public/leaderboard]", err);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard data" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
