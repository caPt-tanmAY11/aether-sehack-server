import { Router } from 'express';
import { attendanceController } from './attendance.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireRoles } from '../middleware/rbac.middleware.js';
import { markAttendanceSchema, facultyOverrideSchema } from '../validators/attendance.validator.js';

const router = Router();

router.post(
  '/mark',
  requireRoles('student'),
  validate(markAttendanceSchema),
  attendanceController.selfMark
);

router.patch(
  '/override',
  requireRoles('faculty'),
  validate(facultyOverrideSchema),
  attendanceController.override
);

router.get(
  '/me/report',
  requireRoles('student'),
  attendanceController.myReport
);

export { router as attendanceRouter };
