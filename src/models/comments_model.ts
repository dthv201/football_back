import mongoose, { Schema, Document } from "mongoose";

export interface IComment extends Document {
  comment: string;
  postId: string;
  owner: string;
}

const commentsSchema = new Schema<IComment>(
  {
    comment: { type: String, required: true },
    postId: { type: String, required: true },
    owner: { type: String, required: true },
  },
  { timestamps: true }
);

const commentsModel = mongoose.model<IComment>("Comment", commentsSchema);

export default commentsModel;
