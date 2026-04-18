import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(10),
  venue: z.string().min(2),
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }),
  expectedAttendance: z.number().min(1).default(50),
});

export const eventApprovalSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  comment: z.string().max(300).optional(),
});
