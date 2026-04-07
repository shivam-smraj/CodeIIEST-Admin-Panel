import mongoose, { Schema, Model } from "mongoose";

export interface IEvent {
  _id: mongoose.Types.ObjectId;
  title: string;
  miniTitle: string;
  description: string;
  imageVariant?: string;
  AvatarSampleData: { name: string; img: string }[];
  TagsList: string[];
  sideDetails1: { text1?: string; text2?: string; text3?: string };
  sideDetails2: { text1?: string; text2?: string; text3?: string };
  completionStatus: number;
  moreInfo: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title:            { type: String, required: true, trim: true },
    miniTitle:        { type: String, required: true, trim: true },
    description:      { type: String, required: true },
    imageVariant:     { type: String },
    AvatarSampleData: [{ name: String, img: String }],
    TagsList:         [{ type: String }],
    sideDetails1:     { text1: String, text2: String, text3: String },
    sideDetails2:     { text1: String, text2: String, text3: String },
    completionStatus: { type: Number, default: 0 },
    moreInfo:         { type: String, default: "#" },
  },
  { timestamps: true }
);

export const Event: Model<IEvent> =
  mongoose.models.Event ?? mongoose.model<IEvent>("Event", EventSchema);
