import { Router } from 'express';
import { timetableController } from './timetable.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireRoles, requireTimetableCoord } from '../middleware/rbac.middleware.js';
import { uploadTimetableSchema, approvalSchema } from '../validators/timetable.validator.js';

const router = Router();

// Upload Timetable - Requires Faculty + 'timetable_coord' subRole
router.post(
  '/',
  requireTimetableCoord,
  validate(uploadTimetableSchema),
  timetableController.upload
);

// HOD View pending timetables
router.get(
  '/pending',
  requireRoles('hod'),
  timetableController.getPending
);

// HOD Approve/Reject Timetable
router.patch(
  '/:id/review',
  requireRoles('hod'),
  validate(approvalSchema),
  timetableController.review
);

// Get My Timetable (Student or Faculty)
router.get(
  '/me',
  requireRoles('student', 'faculty'),
  timetableController.getMyTimetable
);

// Get all approved timetables for the Dept (HOD/Dean)
router.get(
  '/department',
  requireRoles('hod', 'dean'),
  timetableController.getDepartmentTimetables
);

export { router as timetableRouter };
