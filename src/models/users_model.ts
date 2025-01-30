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
  },
  skillLevel: {
    type: String,
    enum: Object.values(SkillLevel),
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
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
   default:"https://www.flaticon.com/free-icon/profile_3135715"
  },
});

const userModel = mongoose.model<IUser>("Users", userSchema);

export default userModel;
