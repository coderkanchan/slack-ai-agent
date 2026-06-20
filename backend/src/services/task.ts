import { TaskModel, ITask } from '../models/Task.js';
import logger from '../utils/logger.js';

export class TaskService {
  public async createTask(title: string, assignedTo: string, assignedBy: string, channelId: string, dueDateStr?: string): Promise<string> {
    try {
      const taskData: any = {
        title: title,
        assignedTo: assignedTo,
        assignedBy: assignedBy,
        channelId: channelId,
        status: 'PENDING',
        priority: 'LOW' | 'MEDIUM' | 'HIGH',
        suggestedNextSteps: string[],
        dueDateStr?: string
      };

      if (dueDateStr) {
        const parsedDate = new Date(dueDateStr);
        if (!isNaN(parsedDate.getTime())) {
          taskData.dueDate = parsedDate;
        }
      }

      const newTask = await TaskModel.create(taskData);

      return JSON.stringify({
        status: 'SUCCESS',
        taskId: newTask._id,
        message: `Task successfully assigned to user ${assignedTo}.`
      });
    } catch (error: any) {
      logger.error({ error, context: 'Task Service' }, '[Task Service Error] Creation failed:');
      return JSON.stringify({ status: 'ERROR', message: error.message });
    }
  }

  public async getChannelTasks(channelId: string, assignedTo?: string): Promise<string> {
    try {
      const query: any = { channelId };
      if (assignedTo) {
        query.assignedTo = assignedTo;
      }

      const tasks = await TaskModel.find(query).sort({ createdAt: -1 }).limit(10);

      if (tasks.length === 0) {
        return "No operational tasks found matching this context registry configuration.";
      }

      return JSON.stringify(tasks.map(t => ({
        id: t._id,
        title: t.title,
        assignedTo: t.assignedTo,
        status: t.status,
        dueDate: t.dueDate ? t.dueDate.toDateString() : 'No Deadline'
      })));
    } catch (error: any) {
      logger.error({ error, context: 'Task Service' }, '[Task Service Error] Fetching logs failed:');
      return JSON.stringify({ status: 'ERROR', message: error.message });
    }
  }

  public async updateTaskStatus(taskId: string, newStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'): Promise<string> {
    try {
      const updatedTask = await TaskModel.findByIdAndUpdate(
        taskId,
        { status: newStatus },
        { new: true }
      );

      if (!updatedTask) {
        return JSON.stringify({ status: 'ERROR', message: 'Task ID not found in database cluster registries.' });
      }

      return JSON.stringify({
        status: 'SUCCESS',
        taskId: updatedTask._id,
        newStatus: updatedTask.status,
        message: `Task status updated successfully to ${newStatus}.`
      });
    } catch (error: any) {
      logger.error({ error, context: 'Task Service' }, '[Task Service Error] Status transition exception');
      return JSON.stringify({ status: 'ERROR', message: error.message });
    }
  }

  public static async createAutonomousTask(taskData: {
    title: string;
    assignedTo: string;
    assignedBy: string;
    channelId: string;
    dueDate?: string;
  }): Promise<ITask> {
    try {
      const newTask = new TaskModel({
        title: taskData.title,
        assignedTo: taskData.assignedTo,
        assignedBy: taskData.assignedBy,
        channelId: taskData.channelId,
        status: 'PENDING',
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined
      });

      return await newTask.save();
    } catch (error) {
      console.error('❌ [TaskService Error] Autonomous task insertion failed:', error);
      logger.error({ error, context: 'Autonomous task insertion' }, '[TaskService Error] Autonomous task insertion failed:');
      throw error;
    }
  }
}