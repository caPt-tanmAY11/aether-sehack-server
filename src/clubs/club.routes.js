import { Router } from 'express';
import { clubController } from './club.controller.js';
import { requireRoles } from '../middleware/rbac.middleware.js';

const router = Router();

// Anyone authenticated can list and view clubs
router.get(
  '/',
  requireRoles('student', 'faculty', 'hod', 'dean', 'council'),
  clubController.list
);

router.get(
  '/my',
  requireRoles('student', 'faculty', 'council'),
  clubController.getMyClubs
);

router.get(
  '/:id',
  requireRoles('student', 'faculty', 'hod', 'dean', 'council'),
  clubController.getById
);

// Council or Faculty creates a club
router.post(
  '/',
  requireRoles('council', 'faculty', 'hod'),
  clubController.create
);

// Any student/council member joins a club
router.post(
  '/:id/join',
  requireRoles('student', 'council'),
  clubController.join
);

// Member leaves a club
router.post(
  '/:id/leave',
  requireRoles('student', 'council', 'faculty'),
  clubController.leave
);

// President or Advisor broadcasts an alert to all club members
router.post(
  '/:id/alert',
  requireRoles('student', 'council', 'faculty'),
  clubController.sendAlert
);

export { router as clubRouter };
