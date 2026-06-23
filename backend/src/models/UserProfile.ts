import { Schema, model, Document } from 'mongoose';

export interface IUserProfile extends Document {
  slackUserId: string;
  name: string;
  vibeScore: number;
  vibeStatus: 'OPTIMAL' | 'NEUTRAL' | 'STRESSED';
  createdAt: Date;
  updatedAt: Date;
}

const UserProfileSchema = new Schema<IUserProfile>(
  {
    slackUserId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      default: ''
    },
    vibeScore: {
      type: Number,
      default: 100
    },
    vibeStatus: {
      type: String,
      enum: ['OPTIMAL', 'NEUTRAL', 'STRESSED'],
      default: 'OPTIMAL'
    }
  },
  {
    timestamps: true
  }
);

export const UserProfile = model<IUserProfile>('UserProfile', UserProfileSchema);
