import { connectDB } from "@/lib/db";
import { AuditLog } from "@/models/AuditLog";
import type { AuditAction, AuditTargetType } from "@/models/AuditLog";
import type { IUser } from "@/models/User";

interface CreateAuditLogParams {
  actor: Pick<IUser, "_id" | "displayName" | "email" | "role">;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  targetName: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
  request: Request;
}

export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  try {
    await connectDB();
    await AuditLog.create({
      actorId:    params.actor._id,
      actorName:  params.actor.displayName,
      actorEmail: params.actor.email,
      actorRole:  params.actor.role,
      action:     params.action,
      targetType: params.targetType,
      targetId:   params.targetId,
      targetName: params.targetName,
      changes:    params.changes ?? {},
      ipAddress:  params.request.headers.get("x-forwarded-for") ??
                  params.request.headers.get("x-real-ip") ?? "unknown",
      userAgent:  params.request.headers.get("user-agent") ?? "unknown",
    });
  } catch (err) {
    // Never let audit log failure break the main request
    console.error("[AuditLog] Failed to create log:", err);
  }
}
