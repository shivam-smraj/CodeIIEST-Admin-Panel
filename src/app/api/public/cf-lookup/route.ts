import { NextRequest, NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/public/cf-lookup?handle=<cfHandle>
 *
 * Server-side proxy to the Codeforces API.
 * Returns CF user info for the given handle so the GDSC site can
 * show a preview before the user confirms their handle.
 *
 * No auth required — CF profiles are public info.
 * We proxy here to avoid CORS and to normalise the response shape.
 */
export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get("handle")?.trim();

  if (!handle || handle.length < 1 || handle.length > 24) {
    return NextResponse.json({ error: "Invalid handle" }, { status: 400, headers: CORS_HEADERS });
  }

  try {
    const cfRes = await fetch(
      `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`,
      { next: { revalidate: 60 } } // Cache for 60s — ratings don't change that fast
    );

    if (!cfRes.ok) {
      return NextResponse.json({ error: "Codeforces API error" }, { status: 502, headers: CORS_HEADERS });
    }

    const data = await cfRes.json() as {
      status:  string;
      result?: { handle: string; rating?: number; maxRating?: number; rank?: string; titlePhoto?: string; }[];
      comment?: string;
    };

    if (data.status !== "OK" || !data.result?.length) {
      return NextResponse.json(
        { error: data.comment || "Handle not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    const u = data.result[0];
    return NextResponse.json({
      handle:    u.handle,
      rating:    u.rating    ?? 0,
      maxRating: u.maxRating ?? 0,
      rank:      u.rank      ?? "unrated",
      avatar:    u.titlePhoto ?? "",
    }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("[public/cf-lookup]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500, headers: CORS_HEADERS });
  }
}
