import mongoose, { Schema, Model } from "mongoose";

export interface IChapter {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  byline?: string;
  leads: mongoose.Types.ObjectId[];
  coreMembers: mongoose.Types.ObjectId[];
  events: {
    eventName: string;
    date?: string;
    location?: string;
    description?: string;
    total?: number;
    progress?: number;
  }[];
  iconset: { icon: string; byline: string }[];
  title?: string;
  highlight?: {
    heading?: string;
    byline?: string;
    icon?: string;
    iconheading?: string;
    iconbyline?: string;
    bylineProps?: Record<string, unknown>;
    imageProps?: Record<string, unknown>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ChapterSchema = new Schema<IChapter>(
  {
    name:        { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    byline:      { type: String },
    leads:       [{ type: Schema.Types.ObjectId, ref: "TeamMember" }],
    coreMembers: [{ type: Schema.Types.ObjectId, ref: "TeamMember" }],
    events: [{
      eventName:   { type: String },
      date:        { type: String },
      location:    { type: String },
      description: { type: String },
      total:       { type: Number },
      progress:    { type: Number },
    }],
    iconset: [{ icon: String, byline: String }],
    title:   { type: String },
    highlight: {
      heading:     String,
      byline:      String,
      icon:        String,
      iconheading: String,
      iconbyline:  String,
      bylineProps: Schema.Types.Mixed,
      imageProps:  Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

export const Chapter: Model<IChapter> =
  mongoose.models.Chapter ?? mongoose.model<IChapter>("Chapter", ChapterSchema);
