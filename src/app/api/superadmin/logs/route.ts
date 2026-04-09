import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { AuditLog } from "@/models/AuditLog";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session?.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const email = searchParams.get("email");
  const dateFrom = searchParams.get("from");
  const dateTo = searchParams.get("to");

  const filter: any = {};
  if (action) filter.action = action;
  if (email) filter.actorEmail = { $regex: email, $options: "i" };
  
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  try {
    await connectDB();
    const logs = await (searchParams.has("all") 
      ? AuditLog.find(filter).sort({ createdAt: -1 })
      : AuditLog.find(filter).sort({ createdAt: -1 }).limit(200)
    ).lean();
    return NextResponse.json(logs);
  } catch (err) {
    console.error("[audit-logs]", err);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
