// import { TaskModel, ITask } from '../models/Task.js';

// export class TaskService {

//   public static async createAutonomousTask(taskData: {
//     title: string;
//     assignedTo: string;
//     assignedBy: string;
//     channelId: string;
//     dueDate?: string;
//   }): Promise<ITask> {
//     try {
//       const newTask = new TaskModel({
//         title: taskData.title,
//         assignedTo: taskData.assignedTo,
//         assignedBy: taskData.assignedBy,
//         channelId: taskData.channelId,
//         status: 'PENDING',
//         dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined
//       });

//       return await newTask.save();
//     } catch (error) {
//       console.error('❌ [TaskService Error] Autonomous task insertion failed:', error);
//       throw error;
//     }
//   }
// }