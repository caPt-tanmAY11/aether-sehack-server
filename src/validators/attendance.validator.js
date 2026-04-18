import { z } from 'zod';

export const markAttendanceSchema = z.object({
  timetableId: z.string().min(1),
  day: z.string().min(1),
  startTime: z.string().min(1),
  studentCoord: z.object({
    x: z.number(),
    y: z.number()
  }).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD required'),
});

export const facultyOverrideSchema = z.object({
  subjectId: z.string().min(1),
  division: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD required'),
  updates: z.array(z.object({
    studentId: z.string().min(1),
    status: z.enum(['present', 'absent', 'late'])
  }))
});
