import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { AuditLog } from "@/models/AuditLog";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(200) // limit to recent 200 for performance
      .lean();
    return NextResponse.json(logs);
  } catch (err) {
    console.error("[audit-logs]", err);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
