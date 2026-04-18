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

// Admins get their pending queue
router.get(
  '/pending',
  requireRoles('council', 'hod', 'dean'),
  eventController.getPending
);

// Admins reviewing an event (Approve/Reject)
router.patch(
  '/:id/review',
  requireRoles('council', 'hod', 'dean'),
  validate(eventApprovalSchema),
  eventController.reviewEvent
);

// Filter requests raised strictly by the active student
router.get(
  '/me',
  requireRoles('student'),
  eventController.myRequests
);

export { router as eventRouter };
