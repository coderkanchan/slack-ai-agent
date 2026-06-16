import { Request, Response } from 'express';
import mongoose from 'mongoose';

export const getDashboardAnalytics = async (req: Request, res: Response): Promise<Response> => {
  try {
    const db = mongoose.connection.db;
    const taskCollection = db ? db.collection('tasks') : null;

    const rawTasks = taskCollection ? await taskCollection.find({}).toArray() : [];

    return res.status(200).json({
      success: true,
      metrics: {
        totalTasks: rawTasks.length,
        completedTasks: rawTasks.filter(t => t.status === 'COMPLETED').length,
        pendingTasks: rawTasks.filter(t => t.status !== 'COMPLETED').length,
        activeVibeScore: 85
      },
      tasks: rawTasks.map(t => ({
        _id: t._id.toString(),
        title: t.title,
        status: t.status
      }))
    });
  } catch (error) {
    console.error('[Dashboard Controller Error]:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};