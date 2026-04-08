import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.user?.id)
    .select("-passwordHash")
    .lean();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user);
}

const updateSchema = z.object({
  displayName:    z.string().min(2).max(60).optional(),
  enrollmentNo:   z.string().max(20).optional(),
  enrollmentYear: z.number().int().min(2015).max(new Date().getFullYear()).optional(),
  githubId:       z.string().max(40).optional(),
  leetcodeId:     z.string().max(40).optional(),
  codechefId:     z.string().max(40).optional(),
});

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    await connectDB();
    const user = await User.findByIdAndUpdate(
      session.user?.id,
      { $set: data },
      { new: true }
    ).select("-passwordHash").lean();

    return NextResponse.json(user);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
