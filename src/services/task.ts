import { TaskModel } from '../models/Task.js';

export class TaskService {

  public async createTask(title: string, assignedTo: string, assignedBy: string, channelId: string, dueDateStr?: string) {
    try {
      const parsedDueDate = dueDateStr ? new Date(dueDateStr) : undefined;

      const newTask = await TaskModel.create({
        title,
        assignedTo,
        assignedBy,
        channelId,
        status: 'PENDING',
        dueDate: parsedDueDate
      });

      return JSON.stringify({
        status: 'SUCCESS',
        taskId: newTask._id,
        message: `Task successfully assigned to user ${assignedTo}.`
      });
    } catch (error: any) {
      console.error('[Task Service Error] Creation failed:', error);
      return JSON.stringify({ status: 'ERROR', message: error.message });
    }
  }

  public async getChannelTasks(channelId: string, assignedTo?: string) {
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
      console.error('[Task Service Error] Fetching logs failed:', error);
      return JSON.stringify({ status: 'ERROR', message: error.message });
    }
  }
}