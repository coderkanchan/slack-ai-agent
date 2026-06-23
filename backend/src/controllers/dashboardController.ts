import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { TaskModel } from '../models/Task.js';
import { broadcastDashboardUpdates } from '../utils/telemetry.js';
import logger from '../utils/logger.js';

export const getDashboardAnalytics = async (req: Request, res: Response): Promise<any> => {
  try {
    const tasks = await TaskModel.find({}).sort({ createdAt: -1 });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const pendingTasks = totalTasks - completedTasks;
    const activeVibeScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 85;

    return res.status(200).json({
      success: true,
      metrics: {
        totalTasks,
        completedTasks,
        pendingTasks,
        activeVibeScore
      },
      tasks: tasks.map(t => ({
        _id: t._id.toString(),
        title: t.title,
        status: t.status,
        priority: t.priority || 'MEDIUM',
        suggestedNextSteps: t.suggestedNextSteps || []
      }))
    });
  } catch (error) {
    logger.error({ error, context: 'Dashboard Controller' }, '[Dashboard Controller Error]');
    return res.status(500).json({ success: false, message: 'Server compilation error.' });
  }
};

export const updateTaskStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { taskId, newStatus } = req.body;

    const updatedTask = await TaskModel.findByIdAndUpdate(
      taskId,
      { $set: { status: newStatus, updatedAt: new Date() } },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: "The requested task was not found in the state database store."
      });
    }

    logger.info({ taskId, newStatus }, 'Task pipeline state transitioned via REST API handler.');

    await broadcastDashboardUpdates();

    return res.status(200).json({
      success: true,
      message: `Task pipeline transition updated successfully to state: ${newStatus}`,
      details: { taskId, status: newStatus }
    });

  } catch (error) {
    logger.error({ error, context: 'Update Task Status Controller' }, '[Update Task Status Controller Error]');
    return res.status(500).json({
      success: false,
      message: 'Internal server architecture crash during state machine modification.'
    });
  }
};