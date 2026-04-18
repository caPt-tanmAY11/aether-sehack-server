import { EVENT_REQUEST_SUBROLES } from '../constants/permissions.js';

// Require specific roles
export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`,
      });
    }
    next();
  };
}

// Require timetable coordinator sub-role (faculty only)
export function requireTimetableCoord(req, res, next) {
  if (!req.user || req.user.role !== 'faculty') {
    return res.status(403).json({ success: false, message: 'Faculty only' });
  }
  if (req.user.subRole !== 'timetable_coord') {
    return res.status(403).json({
      success: false,
      message: 'Only the timetable coordinator for this department can upload timetables'
    });
  }
  next();
}

// Require committee position sub-role (student event requests)
export function requireCommitteePosition(req, res, next) {
  if (!req.user || (req.user.role !== 'student' && req.user.role !== 'council')) {
    return res.status(403).json({ success: false, message: 'Students or Council only' });
  }

  if (req.user.role === 'council') {
    return next();
  }

  if (!req.user.subRole || !EVENT_REQUEST_SUBROLES.includes(req.user.subRole)) {
    return res.status(403).json({
      success: false,
      message: 'Only students with a committee position can raise event requests'
    });
  }
  next();
}

// HOD can only manage their own department
export function requireSameDepartment(req, res, next) {
  const targetDeptId = req.params.departmentId || req.body.departmentId;
  if (req.user?.role === 'dean') { return next(); }
  if (targetDeptId && req.user?.departmentId !== targetDeptId) {
    return res.status(403).json({ success: false, message: 'Access restricted to your department' });
  }
  next();
}
