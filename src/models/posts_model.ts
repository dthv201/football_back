import mongoose, { Schema, Document } from "mongoose";

export interface iPost extends Document {
  title: string;
  owner: string;
  content: string;
  date: Date;
  location: string;
  img?: string;
  participantsIds?: string[];
  teamA?: string[];
  teamB?: string[];
  likesUsersIds?: string[];
  likes_number?: number;
  comments_number?: number;
}

const postSchema = new Schema<iPost>({
  title: { type: String, required: true },
  owner: {
    type: String,
    ref: "users",
    required: true,
  },
  participantsIds: [
    {
      type: String,
      ref: "users",
    },
  ],
  teamA: [
    {
      type: String,
      ref: "users",
    },
  ],
  teamB: [
    {
      type: String,
      ref: "users",
    },
  ],
  content: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  img: { type: String, default: "" },
  likesUsersIds: [
    {
      type: String,
      ref: "users",
    },
  ],
  likes_number: { type: Number, default: 0 },
  comments_number: { type: Number, default: 0 },
});

export default mongoose.model<iPost>("posts", postSchema);
