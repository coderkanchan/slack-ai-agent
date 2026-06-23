import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  query: z.object({
    channelId: z.string().optional(),
    assignedTo: z.string().optional(),
  })
});

export const updateTaskStatusSchema = z.object({
  body: z.object({
    taskId: z.string().min(1, "Task ID is required.").regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId format."),
    newStatus: z.string().refine((val) => ['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(val), {
      message: "Target operational status must be PENDING, IN_PROGRESS, or COMPLETED."
    })
  })
});