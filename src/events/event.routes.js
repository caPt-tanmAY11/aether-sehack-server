import { Router } from 'express';
import { eventController } from './event.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireRoles, requireCommitteePosition } from '../middleware/rbac.middleware.js';
import { createEventSchema, eventApprovalSchema } from '../validators/event.validator.js';

const router = Router();

// Student (Committee Members) Submits an Event
router.post(
  '/',
  requireCommitteePosition,
  validate(createEventSchema),
  eventController.submitEvent
);

// Get all approved events (public to authenticated users)
router.get(
  '/',
  eventController.getAllApproved
);

// Admins get their pending queue
router.get(
  '/pending',
  requireRoles('council', 'hod', 'dean', 'superadmin'),
  eventController.getPending
);

// Admins reviewing an event (Approve/Reject)
router.patch(
  '/:id/review',
  requireRoles('council', 'hod', 'dean', 'superadmin'),
  validate(eventApprovalSchema),
  eventController.reviewEvent
);

// Filter requests raised strictly by the active student
router.get(
  '/me',
  requireRoles('student', 'council'),
  eventController.myRequests
);

export { router as eventRouter };
