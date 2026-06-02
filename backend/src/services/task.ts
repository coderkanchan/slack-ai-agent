import { TaskModel } from '../models/Task.js';

export class TaskService {
  public async createTask(title: string, assignedTo: string, assignedBy: string, channelId: string, dueDateStr?: string) {
    try {
      const taskData: any = {
        title: title,
        assignedTo: assignedTo,
        assignedBy: assignedBy,
        channelId: channelId,
        status: 'PENDING'
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

  public async updateTaskStatus(taskId: string, newStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') {
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
      console.error('[Task Service Error] Status transition exception:', error);
      return JSON.stringify({ status: 'ERROR', message: error.message });
    }
  }
}