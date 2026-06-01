import mongoose, { Schema, Document } from 'mongoose';

export interface IUserProfile extends Document {
  slackUserId: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserProfileSchema: Schema = new Schema(
  
  {
    slackUserId: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: '' }
  },
  {
    timestamps: true
  }
);

export const UserProfile = mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);