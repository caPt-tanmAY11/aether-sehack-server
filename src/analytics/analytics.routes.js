import { Router } from 'express';
import { analyticsController } from './analytics.controller.js';
import { requireRoles } from '../middleware/rbac.middleware.js';

const router = Router();

// HOD combined dashboard — one call for the entire dept overview
router.get('/hod/dashboard', requireRoles('hod'), analyticsController.hodDashboard);

// Dean combined dashboard — college-wide
router.get('/dean/dashboard', requireRoles('dean'), analyticsController.deanDashboard);

// Granular stats — accessible by both HOD and Dean
router.get('/attendance', requireRoles('hod', 'dean'), analyticsController.attendanceStats);
router.get('/syllabus', requireRoles('hod', 'dean'), analyticsController.syllabusStats);
router.get('/issues', requireRoles('hod', 'dean'), analyticsController.issueStats);
router.get('/events', requireRoles('hod', 'dean'), analyticsController.eventStats);

export { router as analyticsRouter };
