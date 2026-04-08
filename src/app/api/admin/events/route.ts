import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import { createAuditLog } from "@/lib/audit";
import { User } from "@/models/User";
import { z } from "zod";

function isAdminOrSuper(role: string) {
  return role === "admin" || role === "superadmin";
}

// ─── GET /api/admin/events ─────────────────────────────────────────────────
export async function GET() {
  const session = await getSession();
  if (!session || !isAdminOrSuper(session?.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await connectDB();
  const events = await Event.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(events);
}

const eventSchema = z.object({
  title:            z.string().min(1).max(200),
  miniTitle:        z.string().min(1).max(100),
  description:      z.string().min(1),
  imageVariant:     z.string().nullish(),
  TagsList:         z.array(z.string()).nullish(),
  completionStatus: z.number().min(0).max(100).nullish(),
  moreInfo:         z.string().nullish(),
  AvatarSampleData: z.array(z.object({ name: z.string().nullish(), img: z.string().nullish() })).nullish(),
  sideDetails1:     z.object({ text1: z.string().nullish(), text2: z.string().nullish(), text3: z.string().nullish() }).nullish(),
  sideDetails2:     z.object({ text1: z.string().nullish(), text2: z.string().nullish(), text3: z.string().nullish() }).nullish(),
});

// ─── POST /api/admin/events ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !isAdminOrSuper(session?.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const data = eventSchema.parse(await req.json());
    await connectDB();
    const event = await Event.create(data as any);

    const actor = await User.findOne({ email: session?.email }).lean();
    if (actor) {
      await createAuditLog({
        actor, action: "CREATE_EVENT", targetType: "Event",
        targetId: event._id.toString(), targetName: event.title,
        changes: {}, request: req,
      });
    }
    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
