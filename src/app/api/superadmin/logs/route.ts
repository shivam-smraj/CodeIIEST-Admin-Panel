import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { AuditLog } from "@/models/AuditLog";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") {
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
