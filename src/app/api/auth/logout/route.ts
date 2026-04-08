import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete({
      name: "__session",
      path: "/",
      domain: process.env.AUTH_DOMAIN || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[logout] error:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
