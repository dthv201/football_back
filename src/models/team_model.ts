import mongoose, { Schema, Document } from "mongoose";

export interface ITeam extends Document {
  name: string;
  manager: mongoose.Types.ObjectId;
  players: mongoose.Types.ObjectId[];
  maxPlayers: number;
}

const teamSchema = new Schema<ITeam>({
  name: { type: String, required: true, unique: true },
  manager: { type: Schema.Types.ObjectId, ref: "User", required: true },
  players: [{ type: Schema.Types.ObjectId, ref: "User" }],
  maxPlayers: { type: Number, default: 10 },
});

export default mongoose.model<ITeam>("Team", teamSchema);
