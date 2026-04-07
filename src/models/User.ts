import mongoose, { Schema, Model } from "mongoose";

export type UserRole = "user" | "admin" | "superadmin" | "alumni";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  // Identity
  googleId?: string;
  email: string;
  displayName: string;
  image?: string;
  // Auth
  passwordHash?: string;
  isEmailVerified: boolean;
  // Role
  role: UserRole;
  // Profile
  enrollmentNo?: string;
  enrollmentYear?: number; // e.g. 2023 — used to compute year (1/2/3/4)
  githubId?: string;
  leetcodeId?: string;
  codechefId?: string;
  // Codeforces (set via CF OAuth)
  codeforcesId?: string;
  codeforcesRating?: number;
  codeforcesAvatar?: string;
  cfVerifiedAt?: Date;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    googleId:         { type: String, sparse: true, unique: true },
    email:            { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayName:      { type: String, required: true, trim: true },
    image:            { type: String },
    passwordHash:     { type: String },
    isEmailVerified:  { type: Boolean, default: false },
    role:             { type: String, enum: ["user", "admin", "superadmin", "alumni"], default: "user" },
    enrollmentNo:     { type: String, trim: true },
    enrollmentYear:   { type: Number },
    githubId:         { type: String, trim: true },
    leetcodeId:       { type: String, trim: true },
    codechefId:       { type: String, trim: true },
    codeforcesId:     { type: String, trim: true },
    codeforcesRating: { type: Number },
    codeforcesAvatar: { type: String },
    cfVerifiedAt:     { type: Date },
  },
  { timestamps: true }
);

// Computed helper: current year in college (1/2/3/4)
UserSchema.virtual("collegeYear").get(function () {
  if (!this.enrollmentYear) return null;
  return new Date().getFullYear() - this.enrollmentYear + 1;
});

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
