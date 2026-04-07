import mongoose, { Schema, Model } from "mongoose";

export interface IPasswordResetToken {
  _id: mongoose.Types.ObjectId;
  jti: string;      // unique token ID embedded in JWT — used to prevent reuse
  email: string;
  used: boolean;    // set true after token is consumed
  createdAt: Date;  // TTL index: auto-delete after 1 hour
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>({
  jti:      { type: String, required: true, unique: true, index: true },
  email:    { type: String, required: true, lowercase: true },
  used:     { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: 3600 }, // 1 hour TTL
});

export const PasswordResetToken: Model<IPasswordResetToken> =
  mongoose.models.PasswordResetToken ??
  mongoose.model<IPasswordResetToken>("PasswordResetToken", PasswordResetTokenSchema);
