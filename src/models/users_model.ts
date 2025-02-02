import mongoose, { Schema, Document } from "mongoose";

export enum SkillLevel {
  BEGINNER = "Beginner",
  INTERMEDIATE = "Intermediate",
  ADVANCED = "Advanced",
}

export interface IUser extends Document {
  username: string;
  skillLevel: SkillLevel;
  email: string;
  password: string;
  refreshToken?: string[];
  profile_img?: string;
}

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true, // Ensures uniqueness is case-insensitive
    trim: true, // Removes extra spaces
  },
  skillLevel: {
    type: String,
    enum: Object.values(SkillLevel),
    default: SkillLevel.BEGINNER,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true, 
  },
  password: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: [String],
    default: [],
  },
  profile_img: {
    type: String,
    default: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
  },
});

const userModel = mongoose.model<IUser>("Users", userSchema);

export default userModel;
