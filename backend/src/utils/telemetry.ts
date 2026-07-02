import { io } from '../index.js';
import { TaskModel } from '../models/Task.js';
import { UserProfile } from '../models/UserProfile.js';
import logger from './logger.js';

export const broadcastDashboardUpdates = async () => {
  try {
    const [tasks, recentProfile] = await Promise.all([
      TaskModel.find({ isDeleted: { $ne: true }, status: { $ne: 'ARCHIVED' } }).sort({ createdAt: -1 }),
      UserProfile.findOne({}).sort({ updatedAt: -1 })
    ]);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const pendingTasks = totalTasks - completedTasks;

    let activeVibeScore = 100;

    if (totalTasks === 0 || pendingTasks === 0) {
      activeVibeScore = 100;

      if (recentProfile && recentProfile.vibeScore !== 100) {
        await UserProfile.updateOne(
          { _id: recentProfile._id },
          { $set: { vibeScore: 100, vibeStatus: 'OPTIMAL', updatedAt: new Date() } }
        );
        logger.info('🔄 Blocker queue cleared. Database organizational sentiment state recovered to OPTIMAL.');
      }
    } else {
      activeVibeScore = recentProfile ? recentProfile.vibeScore : Math.round((completedTasks / totalTasks) * 100);
    }

    const updatedPayload = {
      metrics: {
        totalTasks,
        completedTasks,
        pendingTasks,
        activeVibeScore: activeVibeScore
      },
      tasks: tasks.map(t => ({
        _id: t._id.toString(),
        title: t.title,
        status: t.status,
        assignedTo: t.assignedTo || 'Unassigned',
        priority: t.priority || 'MEDIUM',
        suggestedNextSteps: t.suggestedNextSteps || []
      }))
    };

    io.emit('dashboard_updated', updatedPayload);
    logger.info({ context: 'Telemetry Broadcast' }, '📢 Live metrics synchronized across all client streams.');

  } catch (error) {
    logger.error({ error, context: 'Telemetry Broadcast Failure' }, 'Failed to compute and broadcast matrix metrics.');
  }
};