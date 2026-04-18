import { chatService } from './chat.service.js';

export const chatController = {
  async getHistory(req, res, next) {
    try {
      const messages = await chatService.getHistory(req.params.roomId);
      res.json({ success: true, data: messages });
    } catch (err) { next(err); }
  },

  async sendMessage(req, res, next) {
    try {
      const { message } = req.body;
      if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message is required' });
      
      // If student is sending, verify they have permission
      if (req.user.role === 'student') {
        const [idA, idB] = req.params.roomId.split('_');
        const facultyId = idA === req.user.userId.toString() ? idB : idA;
        const allowed = await chatService.studentCanChat(req.user.userId, facultyId);
        if (!allowed) {
          return res.status(403).json({
            success: false,
            message: 'You can only reply once faculty has messaged you, or after your advising request is approved.'
          });
        }
      }
      
      const msg = await chatService.sendMessage(req.user.userId, req.user.role, req.params.roomId, message.trim());
      res.status(201).json({ success: true, data: msg });
    } catch (err) { next(err); }
  },

  async getInbox(req, res, next) {
    try {
      const inbox = await chatService.getInbox(req.user.userId);
      res.json({ success: true, data: inbox });
    } catch (err) { next(err); }
  },

  async canChat(req, res, next) {
    try {
      const allowed = await chatService.studentCanChat(req.user.userId, req.params.facultyId);
      res.json({ success: true, data: { allowed } });
    } catch (err) { next(err); }
  },
};
