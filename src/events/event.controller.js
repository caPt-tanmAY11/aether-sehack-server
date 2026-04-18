import { eventService } from './event.service.js';

export const eventController = {
  async submitEvent(req, res, next) {
    try {
      const event = await eventService.createRequest(req.user, req.body);
      res.status(201).json({ success: true, message: 'Event submitted to HOD', data: event });
    } catch (err) { next(err); }
  },

  async getPending(req, res, next) {
    try {
      const requests = await eventService.getPendingRequests(req.user.role, req.user.departmentId);
      res.status(200).json({ success: true, count: requests.length, data: requests });
    } catch(err) { next(err); }
  },

  async reviewEvent(req, res, next) {
    try {
      const { status, comment } = req.body;
      const event = await eventService.processApproval(req.params.id, req.user, status, comment);
      res.status(200).json({ success: true, message: `Event ${status} at ${req.user.role} stage`, data: event });
    } catch(err) { next(err); }
  },

  async myRequests(req, res, next) {
    try {
      const requests = await eventService.getMyEvents(req.user.userId);
      res.status(200).json({ success: true, data: requests });
    } catch(err) { next(err); }
  },

  async getAllApproved(req, res, next) {
    try {
      const events = await eventService.getAllApproved();
      res.status(200).json({ success: true, count: events.length, data: events });
    } catch(err) { next(err); }
  }
};
