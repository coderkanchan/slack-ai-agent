import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { TaskModel } from '../models/Task.js';
import { broadcastDashboardUpdates } from '../utils/telemetry.js';
import logger from '../utils/logger.js';
import { slackApp } from '../index.js';

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
    const taskId = req.params.id;
    const newStatus = 'COMPLETED';

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

    try {
      const targetChannel = process.env.SLACK_CHANNEL_ID || 'general';

      await slackApp.client.chat.postMessage({
        channel: targetChannel,
        text: `✅ *Resolution Telemetry Event*\n\n• *Task Resolved:* \`${updatedTask.title}\`\n• *Status Change:* \`PENDING\` ➔ *_\`COMPLETED\`_*\n• *Trigger Source:* \`VibeCheck Enterprise Panel Operations Layer\``
      });
      logger.info({ taskId }, 'Slack resolution alert dispatched successfully.');
    } catch (slackError) {
      logger.error({ slackError }, 'Failed to dispatch notification over Slack matrix thread.');
    }

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