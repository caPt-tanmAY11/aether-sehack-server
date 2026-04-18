import { Router } from 'express';
import { issueController } from './issue.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireRoles } from '../middleware/rbac.middleware.js';
import { createIssueSchema, updateIssueSchema } from '../validators/issue.validator.js';

const router = Router();

// Anyone can submit an issue
router.post(
  '/',
  validate(createIssueSchema),
  issueController.createOne
);

// Students fetching their own reports
router.get(
  '/me',
  issueController.fetchMine
);

// Admins fetching all campus issues
router.get(
  '/all',
  requireRoles('hod', 'dean'),
  issueController.fetchAll
);

// Admin processing & resolving an issue
router.patch(
  '/:id',
  requireRoles('hod', 'dean'),
  validate(updateIssueSchema),
  issueController.patchIssue
);

export { router as issueRouter };
