import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { TaskModel } from '../models/Task.js';
import { broadcastDashboardUpdates } from '../utils/telemetry.js';
import logger from '../utils/logger.js';
import { slackApp } from '../index.js';

export const getDashboardAnalytics = async (req: Request, res: Response): Promise<any> => {
  try {
    const tasks = await TaskModel.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });

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
    const { action } = req.body; 

    let updateFields: any = { updatedAt: new Date() };
    let slackNotificationText = '';
    let responseMessage = '';

    if (action === 'DELETE') {
      updateFields.isDeleted = true;
      responseMessage = 'Task was softly removed from state cluster.';
      slackNotificationText = `🗑️ *Task Archival Event*\n\n• *Task:* \`${taskId}\`\n• *Action:* \`SOFT_DELETED\`\n• *Source:* \`VibeCheck Enterprise Panel Operations Layer\``;
    } else if (action === 'PENDING') {
      updateFields.status = 'PENDING';
      responseMessage = 'Task was successfully reopened to PENDING state.';
      slackNotificationText = `🔄 *Task Reopened/State Reset Event*\n\n• *Status Change:* \`COMPLETED\` ➔ *_\`PENDING\`_*\n• *Source:* \`VibeCheck Enterprise Panel Operations Layer\``;
    } else {
      updateFields.status = 'COMPLETED';
      responseMessage = 'Task pipeline transition updated successfully to state: COMPLETED';
      slackNotificationText = `✅ *Resolution Telemetry Event*\n\n• *Status Change:* \`PENDING\` ➔ *_\`COMPLETED\`_*\n• *Source:* \`VibeCheck Enterprise Panel Operations Layer\``;
    }

    const updatedTask = await TaskModel.findByIdAndUpdate(
      taskId,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: "The requested task was not found in the state database store."
      });
    }

    slackNotificationText = slackNotificationText.replace('• *Status Change:*', `• *Task:* \`${updatedTask.title}\`\n• *Status Change:*`);
    if (action === 'DELETE') {
      slackNotificationText = `🗑️ *Task Archival Event*\n\n• *Task:* \`${updatedTask.title}\`\n• *Action:* \`SOFT_DELETED\`\n• *Source:* \`VibeCheck Enterprise Panel Operations Layer\``;
    }

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
      details: { taskId, status: updatedTask.status, isDeleted: updatedTask.isDeleted }
    });

  } catch (error) {
    logger.error({ error, context: 'Update Task Status Controller' }, '[Update Task Status Controller Error]');
    return res.status(500).json({
      success: false,
      message: 'Internal server architecture crash during state machine modification.'
    });
  }
};