import { io } from '../index.js';
import { TaskModel }  from '../models/Task.js'; 
import logger from './logger.js';

export const broadcastDashboardUpdates = async () => {
  try {
    const tasks = await TaskModel.find({}).sort({ createdAt: -1 });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const pendingTasks = totalTasks - completedTasks;

    const activeVibeScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    const updatedPayload = {
      metrics: {
        totalTasks,
        completedTasks,
        pendingTasks,
        activeVibeScore: activeVibeScore || 85 
      },
      tasks: tasks.map(t => ({
        _id: t._id.toString(),
        title: t.title,
        status: t.status,
        assignedTo: t.assignedTo || 'Unassigned'
      }))
    };

    io.emit('dashboard_updated', updatedPayload);
    logger.info({ context: 'Telemetry Broadcast' }, '📢 Live metrics synchronized across all client streams.');

  } catch (error) {
    logger.error({ error, context: 'Telemetry Broadcast Failure' }, 'Failed to compute and broadcast matrix metrics.');
  }
};