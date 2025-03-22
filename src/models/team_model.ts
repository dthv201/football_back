import mongoose, { Schema, Document } from "mongoose";

export interface ITeam extends Document {
  postId: string;
  teamA: string[];
  teamB: string[];
  maxPlayers: number;
}

const teamSchema = new Schema<ITeam>({
  postId: { type: String, required: true, unique: true },
  teamA: [{ type: String }],
  teamB: [{ type: String }],
  maxPlayers: { type: Number, default: 10 },
});

export default mongoose.model<ITeam>("Team", teamSchema);
