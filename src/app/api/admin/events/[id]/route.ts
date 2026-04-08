import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import { User } from "@/models/User";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

function isAdminOrSuper(role: string) {
  return role === "admin" || role === "superadmin";
}

type Params = { params: Promise<{ id: string }> };

// ─── GET /api/admin/events/[id] ───────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !isAdminOrSuper(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await connectDB();
  const event = await Event.findById(id).lean();
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(event);
}

const updateSchema = z.object({
  title:            z.string().min(1).max(200).nullish(),
  miniTitle:        z.string().max(100).nullish(),
  description:      z.string().nullish(),
  imageVariant:     z.string().nullish(),
  TagsList:         z.array(z.string()).nullish(),
  completionStatus: z.number().min(0).max(100).nullish(),
  moreInfo:         z.string().nullish(),
  AvatarSampleData: z.array(z.object({ name: z.string().nullish(), img: z.string().nullish() })).nullish(),
  sideDetails1:     z.object({ text1: z.string().nullish(), text2: z.string().nullish(), text3: z.string().nullish() }).nullish(),
  sideDetails2:     z.object({ text1: z.string().nullish(), text2: z.string().nullish(), text3: z.string().nullish() }).nullish(),
});

// ─── PUT /api/admin/events/[id] ───────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !isAdminOrSuper(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const data = updateSchema.parse(await req.json());
    await connectDB();

    const before = await Event.findById(id).lean();
    if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await Event.findByIdAndUpdate(id, { $set: data as any }, { new: true }).lean();

    // Build changes diff for audit log
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    for (const [key, val] of Object.entries(data)) {
      const prev = (before as unknown as Record<string, unknown>)[key];
      if (JSON.stringify(prev) !== JSON.stringify(val)) {
        changes[key] = { from: prev, to: val };
      }
    }

    const actor = await User.findOne({ email: session?.email }).lean();
    if (actor && Object.keys(changes).length > 0) {
      await createAuditLog({
        actor, action: "UPDATE_EVENT", targetType: "Event",
        targetId: id, targetName: before.title,
        changes, request: req,
      });
    }
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// ─── DELETE /api/admin/events/[id] ───────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !isAdminOrSuper(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await connectDB();
  const event = await Event.findByIdAndDelete(id).lean();
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const actor = await User.findOne({ email: session?.email }).lean();
  if (actor) {
    await createAuditLog({
      actor, action: "DELETE_EVENT", targetType: "Event",
      targetId: id, targetName: event.title,
      changes: {}, request: req,
    });
  }
  return NextResponse.json({ success: true });
}
