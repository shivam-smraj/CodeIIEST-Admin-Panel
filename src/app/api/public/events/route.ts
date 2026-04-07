import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/public/events
 * Returns all events (public, no auth required).
 */
export async function GET(_req: NextRequest) {
  try {
    await connectDB();
    const events = await Event.find()
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(events, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("[public/events]", err);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
