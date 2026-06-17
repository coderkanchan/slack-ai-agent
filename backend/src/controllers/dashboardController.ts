import { Request, Response } from 'express';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

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
    logger.error({ error, context: 'Dashboard Controller' }, '[Dashboard Controller Error]');
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateTaskStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { taskId, newStatus } = req.body;

    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database connection failure.' });
    }

    const taskCollection = db.collection('tasks');

    const updateResult = await taskCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(taskId) },
      { $set: { status: newStatus, updatedAt: new Date() } }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "The requested task was not found in the state database store."
      });
    }
    logger.info({ taskId, newStatus }, 'Task pipeline state transitioned successfully');
    return res.status(200).json({
      success: true,
      message: `Task pipeline transition updated successfully to state: ${newStatus}`,
      details: {
        taskId,
        status: newStatus
      }
    });

  } catch (error) {
    logger.error({ error, context: 'Update Task Status Controller' }, '[Update Task Status Controller Error]');
    return res.status(500).json({
      success: false,
      message: 'Internal server architecture crash during state machine modification.'
    });
  }
};