import mongoose, { Schema, Model } from "mongoose";

export type AuditAction =
  | "CREATE_EVENT" | "UPDATE_EVENT" | "DELETE_EVENT"
  | "CREATE_TEAM_MEMBER" | "UPDATE_TEAM_MEMBER" | "DELETE_TEAM_MEMBER"
  | "CREATE_CHAPTER" | "UPDATE_CHAPTER" | "DELETE_CHAPTER"
  | "PROMOTE_USER" | "DEMOTE_USER" | "DELETE_USER" | "UPDATE_USER_ROLE";

export type AuditTargetType = "Event" | "TeamMember" | "Chapter" | "User";

export interface IAuditLog {
  _id: mongoose.Types.ObjectId;
  // Who performed the action
  actorId: mongoose.Types.ObjectId;
  actorName: string;    // denormalized — preserved even if user is deleted
  actorEmail: string;   // denormalized
  actorRole: string;    // denormalized
  // What happened
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;     // string ObjectId of affected document
  targetName: string;   // denormalized: event title, user name, etc.
  // What changed: { fieldName: { from: oldValue, to: newValue } }
  changes: Record<string, { from: unknown; to: unknown }>;
  // Context
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  actorId:    { type: Schema.Types.ObjectId, ref: "User", required: true },
  actorName:  { type: String, required: true },
  actorEmail: { type: String, required: true },
  actorRole:  { type: String, required: true },
  action:     { type: String, required: true },
  targetType: { type: String, required: true },
  targetId:   { type: String, required: true },
  targetName: { type: String, required: true },
  changes:    { type: Schema.Types.Mixed, default: {} },
  ipAddress:  { type: String, default: "unknown" },
  userAgent:  { type: String, default: "unknown" },
  createdAt:  { type: Date, default: Date.now, index: true },
});

// Immutable — never modified after creation
AuditLogSchema.set("strict", true);

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ?? mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
