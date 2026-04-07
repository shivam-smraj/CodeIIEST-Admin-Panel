import mongoose, { Schema, Model } from "mongoose";

export interface ITeamMember {
  _id: mongoose.Types.ObjectId;
  name: string;
  profilepic?: string;
  description?: string;
  website?: string;
  codeiiest?: string; // role in codeiiest, e.g. "Web Lead"
  gdg?: string;       // role in GDG chapter
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    name:        { type: String, required: true, trim: true },
    profilepic:  { type: String },
    description: { type: String },
    website:     { type: String },
    codeiiest:   { type: String, trim: true },
    gdg:         { type: String, trim: true },
  },
  { timestamps: true }
);

export const TeamMember: Model<ITeamMember> =
  mongoose.models.TeamMember ??
  mongoose.model<ITeamMember>("TeamMember", TeamMemberSchema);
