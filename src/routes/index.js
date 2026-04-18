import { Router } from 'express';
import { timetableRouter } from '../timetable/timetable.routes.js';
import { attendanceRouter } from '../attendance/attendance.routes.js';
import { syllabusRouter } from '../syllabus/syllabus.routes.js';
import { eventRouter } from '../events/event.routes.js';
import { issueRouter } from '../issues/issue.routes.js';
import { notificationRouter } from '../notifications/notification.routes.js';
import { chatbotRouter } from '../chatbot/chatbot.routes.js';
import { analyticsRouter } from '../analytics/analytics.routes.js';

const router = Router();

// Protected API routes
router.use('/timetable', timetableRouter);
router.use('/attendance', attendanceRouter);
router.use('/syllabus', syllabusRouter);
router.use('/events', eventRouter);
router.use('/issues', issueRouter);
router.use('/notifications', notificationRouter);
router.use('/chatbot', chatbotRouter);
router.use('/analytics', analyticsRouter);

export { router as apiRouter };
