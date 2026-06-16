import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  query: z.object({
    channelId: z.string().optional(),
    assignedTo: z.string().optional(),
  }).optional()
});

export const updateTaskStatusSchema = z.object({
  body: z.object({
    taskId: z
      .string({ required_error: "Task ID is required for state machine transitions." })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId format."),

    newStatus: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED'], {
      required_error: "Target operational status is required.",
      invalid_type_error: "Status must be PENDING, IN_PROGRESS, or COMPLETED."
    })
  })
});