import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  query: z.object({
    channelId: z.string().optional(),
    assignedTo: z.string().optional(),
  }).optional()
});

const STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'] as const;

export const updateTaskStatusSchema = z.object({
  body: z.object({
    taskId: z.string({
      errorMap: (issue, ctx) => {
        if (issue.code === z.ZodIssueCode.invalid_type && ctx.data === undefined) {
          return { message: "Task ID is required for state machine transitions." };
        }
        return { message: ctx.defaultError };
      }
    }).regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId format."),

    newStatus: z.enum(STATUSES, {
      errorMap: (issue, ctx) => {
        if (issue.code === z.ZodIssueCode.invalid_type && ctx.data === undefined) {
          return { message: "Target operational status is required." };
        }
        return { message: "Status must be PENDING, IN_PROGRESS, or COMPLETED." };
      }
    })
  })
});