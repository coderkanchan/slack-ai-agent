import mongoose, { Schema, Document } from 'mongoose';

export interface IUserProfile extends Document {
  slackUserId: string;
  name?: string;
  vibeScore: number;
  vibeStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserProfileSchema = new mongoose.Schema(
  {
    slackUserId: { type: String, required: true, unique: true },
    name: { type: String, default: '' },
    vibeScore: { type: Number, default: 100 },
    vibeStatus: { type: String, default: 'OPTIMAL' },
    updatedAt: { type: Date, default: Date.now }
  }, { timestamps: true }
);

export const UserProfile = mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);