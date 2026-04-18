import { Router } from 'express';
import { chatController } from './chat.controller.js';
import { requireRoles } from '../middleware/rbac.middleware.js';

const router = Router();

// Get chat inbox (all conversations)
router.get(
  '/inbox',
  requireRoles('student', 'faculty', 'hod', 'superadmin'),
  chatController.getInbox
);

// Check if student can chat with a faculty
router.get(
  '/can-chat/:facultyId',
  requireRoles('student'),
  chatController.canChat
);

// Get chat history for a room (student or faculty)
router.get(
  '/:roomId',
  requireRoles('student', 'faculty', 'hod', 'superadmin'),
  chatController.getHistory
);

// Send a message to a room
router.post(
  '/:roomId',
  requireRoles('student', 'faculty', 'hod', 'superadmin'),
  chatController.sendMessage
);

export { router as chatRouter };
