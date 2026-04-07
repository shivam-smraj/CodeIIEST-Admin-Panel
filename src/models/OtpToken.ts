import mongoose, { Schema, Model } from "mongoose";

export interface IOtpToken {
  _id: mongoose.Types.ObjectId;
  email: string;
  otpHash: string;        // bcrypt hash — never store plain OTP
  purpose: "registration" | "email_change";
  attempts: number;       // increment on wrong guess; reject after 5
  createdAt: Date;        // TTL index: auto-delete after 10 minutes
}

const OtpTokenSchema = new Schema<IOtpToken>({
  email:    { type: String, required: true, index: true, lowercase: true },
  otpHash:  { type: String, required: true },
  purpose:  { type: String, enum: ["registration", "email_change"], required: true },
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // 600s = 10 min TTL
});

export const OtpToken: Model<IOtpToken> =
  mongoose.models.OtpToken ?? mongoose.model<IOtpToken>("OtpToken", OtpTokenSchema);
