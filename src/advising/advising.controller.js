import { advisingService } from './advising.service.js';

export const advisingController = {
  async createNote(req, res, next) {
    try {
      const note = await advisingService.createNote(req.user.userId, req.body);
      res.status(201).json({ success: true, message: 'Advising note created', data: note });
    } catch (err) { next(err); }
  },

  async getNotesForStudent(req, res, next) {
    try {
      const notes = await advisingService.getNotesForStudent(req.user.userId, req.params.studentId);
      res.json({ success: true, count: notes.length, data: notes });
    } catch (err) { next(err); }
  },

  async getAllMyNotes(req, res, next) {
    try {
      const notes = await advisingService.getAllMyNotes(req.user.userId);
      res.json({ success: true, count: notes.length, data: notes });
    } catch (err) { next(err); }
  },

  async getMySharedNotes(req, res, next) {
    try {
      const notes = await advisingService.getSharedNotesForStudent(req.user.userId);
      res.json({ success: true, count: notes.length, data: notes });
    } catch (err) { next(err); }
  },

  async getPendingFollowUps(req, res, next) {
    try {
      const notes = await advisingService.getPendingFollowUps(req.user.userId);
      res.json({ success: true, count: notes.length, data: notes });
    } catch (err) { next(err); }
  },

  async markFollowUpDone(req, res, next) {
    try {
      const note = await advisingService.markFollowUpDone(req.params.noteId, req.user.userId);
      res.json({ success: true, data: note });
    } catch (err) { next(err); }
  },
};
