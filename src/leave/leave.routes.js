import { Router } from 'express';
import { leaveController } from './leave.controller.js';
import { requireRoles } from '../middleware/rbac.middleware.js';

const router = Router();

// Faculty applies for leave
router.post(
  '/',
  requireRoles('faculty'),
  leaveController.apply
);

// Faculty views their own leave history
router.get(
  '/my',
  requireRoles('faculty'),
  leaveController.getMyLeaves
);

// HOD views all pending leaves in their department
router.get(
  '/pending',
  requireRoles('hod', 'superadmin'),
  leaveController.getPending
);

// HOD or Dean views all leaves for their department (with optional ?status= filter)
router.get(
  '/department',
  requireRoles('hod', 'dean', 'superadmin'),
  leaveController.getDeptLeaves
);

// HOD approves or rejects a leave request
router.patch(
  '/:id/review',
  requireRoles('hod', 'superadmin'),
  leaveController.review
);

export { router as leaveRouter };
