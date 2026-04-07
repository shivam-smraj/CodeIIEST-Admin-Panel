import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User, UserRole } from "@/models/User";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const users = await User.find().select("-passwordHash").lean();
  return NextResponse.json(users);
}

const updateSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["user", "admin", "superadmin", "alumni"]),
});

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = updateSchema.parse(await req.json());
    
    // Prevent self-demotion
    if (data.userId === session.user.id && data.role !== "superadmin") {
      return NextResponse.json({ error: "You cannot demote yourself." }, { status: 400 });
    }

    await connectDB();
    const userToUpdate = await User.findById(data.userId).lean();
    if (!userToUpdate) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const oldRole = userToUpdate.role;
    if (oldRole === data.role) {
      return NextResponse.json({ message: "Role is already set to requested value." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      data.userId,
      { $set: { role: data.role } },
      { new: true }
    ).select("-passwordHash").lean();

    const actor = await User.findById(session.user.id).lean();
    if (actor) {
      await createAuditLog({
        actor,
        action: "UPDATE_USER_ROLE",
        targetType: "User",
        targetId: data.userId,
        targetName: updatedUser?.email ?? "Unknown User",
        changes: {
          role: { from: oldRole, to: data.role },
        },
        request: req,
      });
    }

    return NextResponse.json(updatedUser);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    console.error("[update-role]", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
