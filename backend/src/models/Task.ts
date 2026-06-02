import { Schema, model, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  assignedTo: string;
  assignedBy: string;
  channelId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate?: Date;
  createdAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    assignedTo: {
      type: String,
      required: true,
      index: true
    },
    assignedBy: {
      type: String,
      required: true
    },
    channelId: {
      type: String,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
      default: 'PENDING'
    },
    dueDate: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

export const TaskModel = model<ITask>('Task', TaskSchema);