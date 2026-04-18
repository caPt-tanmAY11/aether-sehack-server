import { clubService } from './club.service.js';

export const clubController = {
  async create(req, res, next) {
    try {
      const club = await clubService.create(req.user, req.body);
      res.status(201).json({ success: true, message: 'Club created', data: club });
    } catch (err) { next(err); }
  },

  async list(req, res, next) {
    try {
      const clubs = await clubService.list(req.query.category);
      res.json({ success: true, count: clubs.length, data: clubs });
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const club = await clubService.getById(req.params.id);
      res.json({ success: true, data: club });
    } catch (err) { next(err); }
  },

  async join(req, res, next) {
    try {
      const club = await clubService.join(req.params.id, req.user.userId);
      res.json({ success: true, message: 'Joined club successfully', data: { name: club.name, memberCount: club.members.filter(m => m.isActive).length } });
    } catch (err) { next(err); }
  },

  async leave(req, res, next) {
    try {
      await clubService.leave(req.params.id, req.user.userId);
      res.json({ success: true, message: 'Left club successfully' });
    } catch (err) { next(err); }
  },

  async sendAlert(req, res, next) {
    try {
      const result = await clubService.sendAlert(req.params.id, req.user.userId, req.body);
      res.json({ success: true, message: `Alert sent to ${result.sent} member(s)`, data: result });
    } catch (err) { next(err); }
  },

  async getMyClubs(req, res, next) {
    try {
      const clubs = await clubService.getMyClubs(req.user.userId);
      res.json({ success: true, count: clubs.length, data: clubs });
    } catch (err) { next(err); }
  },
};
