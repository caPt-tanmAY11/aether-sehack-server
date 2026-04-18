import { leaveService } from './leave.service.js';

export const leaveController = {
  async apply(req, res, next) {
    try {
      const leave = await leaveService.apply(req.user.userId, req.body);
      res.status(201).json({ success: true, message: 'Leave request submitted', data: leave });
    } catch (err) { next(err); }
  },

  async getPending(req, res, next) {
    try {
      const leaves = await leaveService.getPendingForHOD(req.user.userId);
      res.json({ success: true, count: leaves.length, data: leaves });
    } catch (err) { next(err); }
  },

  async review(req, res, next) {
    try {
      const { status, comment } = req.body;
      const leave = await leaveService.review(req.params.id, req.user.userId, status, comment);
      res.json({ success: true, data: leave });
    } catch (err) { next(err); }
  },

  async getMyLeaves(req, res, next) {
    try {
      const leaves = await leaveService.getMyLeaves(req.user.userId);
      res.json({ success: true, count: leaves.length, data: leaves });
    } catch (err) { next(err); }
  },

  async getDeptLeaves(req, res, next) {
    try {
      const { status } = req.query;
      const leaves = await leaveService.getDeptLeaves(req.user.departmentId, status);
      res.json({ success: true, count: leaves.length, data: leaves });
    } catch (err) { next(err); }
  },

  async studentApply(req, res, next) {
    try {
      const leave = await leaveService.applyStudentLeave(req.user.userId, req.body);
      res.status(201).json({ success: true, message: 'Leave application submitted', data: leave });
    } catch (err) { next(err); }
  },

  async studentMyLeaves(req, res, next) {
    try {
      const leaves = await leaveService.getStudentMyLeaves(req.user.userId);
      res.json({ success: true, data: leaves });
    } catch (err) { next(err); }
  },

  async studentIncoming(req, res, next) {
    try {
      const leaves = await leaveService.getStudentLeavesForFaculty(req.user.userId);
      res.json({ success: true, data: leaves });
    } catch (err) { next(err); }
  },

  async studentReview(req, res, next) {
    try {
      const leave = await leaveService.reviewStudentLeave(req.user.userId, req.params.id, req.body);
      res.json({ success: true, data: leave });
    } catch (err) { next(err); }
  },
};
