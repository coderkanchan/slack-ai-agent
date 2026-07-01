import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { TaskModel } from '../models/Task.js';
import { broadcastDashboardUpdates } from '../utils/telemetry.js';
import logger from '../utils/logger.js';
import { slackApp } from '../index.js';

export const getDashboardAnalytics = async (req: Request, res: Response): Promise<any> => {
  try {
    const [allTasks, metricsAggregate] = await Promise.all([
      TaskModel.find({}).sort({ createdAt: -1 }),
      TaskModel.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        {
          $group: {
            _id: null,
            totalTasks: { $sum: 1 },
            completedTasks: {
              $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    const totalTasks = metricsAggregate[0]?.totalTasks || 0;
    const completedTasks = metricsAggregate[0]?.completedTasks || 0;
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
      tasks: allTasks.map(t => ({
        _id: t._id.toString(),
        title: t.title,
        status: t.status,
        priority: t.priority || 'MEDIUM',
        isDeleted: t.isDeleted || false,
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

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ success: false, message: 'Invalid target cluster node ID.' });
    }

    const action = typeof req.body === 'object' && req.body !== null && 'action' in req.body
      ? req.body.action
      : (req.body || req.query.action);

    const existingTask = await TaskModel.findById(taskId);
    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: "The requested task was not found in the state database store."
      });
    }

    const oldStatus = existingTask.status || 'PENDING';
    let updateFields: any = { updatedAt: new Date() };
    let slackNotificationText = '';
    let responseMessage = '';

    if (action === 'DELETE') {
      updateFields.isDeleted = true;
      updateFields.status = 'ARCHIVED';
      responseMessage = 'Task was softly removed from state cluster.';
      slackNotificationText = `🗑️ *Task Archival Event*\n\n• *Task:* \`${existingTask.title}\`\n• *Action:* \`SOFT_DELETED\`\n• *Source:* \`VibeCheck Enterprise Panel Operations Layer\``;
    } else if (action === 'PENDING') {
      updateFields.status = 'PENDING';
      updateFields.isDeleted = false; 
      responseMessage = 'Task was successfully reopened to PENDING state.';
      slackNotificationText = `🔄 *Task Reopened/State Reset Event*\n\n• *Task:* \`${existingTask.title}\`\n• *Status Change:* \`${oldStatus}\` ➔ *_\`PENDING\`_*\n• *Source:* \`VibeCheck Enterprise Panel Operations Layer\``;
    } else {
      updateFields.status = 'COMPLETED';
      updateFields.isDeleted = false; 
      responseMessage = 'Task pipeline transition updated successfully to state: COMPLETED';
      slackNotificationText = `✅ *Resolution Telemetry Event*\n\n• *Task:* \`${existingTask.title}\`\n• *Status Change:* \`${oldStatus}\` ➔ *_\`COMPLETED\`_*\n• *Source:* \`VibeCheck Enterprise Panel Operations Layer\``;
    }

    const updatedTask = await TaskModel.findByIdAndUpdate(
      taskId,
      { $set: updateFields },
      { new: true }
    );

    logger.info({ taskId, action }, 'Task pipeline state transitioned via dynamic REST API handler.');

    await broadcastDashboardUpdates();

    try {
      const targetChannel = process.env.SLACK_CHANNEL_ID || 'general';
      await slackApp.client.chat.postMessage({
        channel: targetChannel,
        text: slackNotificationText
      });
      logger.info({ taskId }, 'Slack tracking alert dispatched successfully.');
    } catch (slackError) {
      logger.error({ slackError }, 'Failed to dispatch notification over Slack matrix thread.');
    }

    return res.status(200).json({
      success: true,
      message: responseMessage,
      details: { taskId, status: updatedTask?.status, isDeleted: updatedTask?.isDeleted }
    });

  } catch (error) {
    logger.error({ error, context: 'Update Task Status Controller' }, '[Update Task Status Controller Error]');
    return res.status(500).json({
      success: false,
      message: 'Internal server architecture crash during state machine modification.'
    });
  }
};