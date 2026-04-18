import { Router } from 'express';
import { syllabusController } from './syllabus.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireRoles } from '../middleware/rbac.middleware.js';
import { initSyllabusSchema, updateTopicSchema } from '../validators/syllabus.validator.js';

const router = Router();

// Faculty initializing the tracker map
router.post(
  '/init',
  requireRoles('faculty'),
  validate(initSyllabusSchema),
  syllabusController.initTracker
);

// Faculty marking a topic as complete
router.patch(
  '/:trackerId/topic',
  requireRoles('faculty'),
  validate(updateTopicSchema),
  syllabusController.updateTopic
);

// Students get progress numbers
router.get(
  '/overview',
  requireRoles('student'),
  syllabusController.studentOverview
);

export { router as syllabusRouter };
