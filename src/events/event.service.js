import { EventRequest, Timetable, User, getPublisher } from '../shared.js';
import mongoose from 'mongoose';

// Checks overlaps against all approved timetables containing a specific room/venue
async function checkVenueClash(venueName, startTime, endTime) {
  const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(startTime).getDay()];
  const startHour = String(new Date(startTime).getHours()).padStart(2, '0') + ':' + String(new Date(startTime).getMinutes()).padStart(2, '0');
  const endHour = String(new Date(endTime).getHours()).padStart(2, '0') + ':' + String(new Date(endTime).getMinutes()).padStart(2, '0');

  // Look up if any timetable has a slot exactly in this venue right now
  const clash = await Timetable.findOne({
    status: 'approved',
  }).populate({
    path: 'slots.roomId',
    match: { name: new RegExp(venueName, 'i') } // Basic venue search match
  });

  if (!clash) return false;

  // Manual strict comparison checking overlap logic (simplified for prototype)
  const exactSlot = clash.slots.find(s => s.day === dayOfWeek && s.roomId && s.roomId.name === venueName);
  if (exactSlot) {
    if (startHour < exactSlot.endTime && endHour > exactSlot.startTime) return true;
  }
  return false;
}

class EventService {
  async createRequest(user, data) {
    const { title, description, venue, startTime, endTime, expectedAttendance } = data;
    
    // Automatic 1-step algorithmic clash check
    const isClashing = await checkVenueClash(venue, startTime, endTime);

    const event = await EventRequest.create({
      requestedBy: user.userId,
      departmentId: user.departmentId,
      title,
      description,
      venue,
      startTime,
      endTime,
      expectedAttendance,
      conflictChecked: true,
      conflictResult: isClashing ? { msg: `Conflict found with academic timetable for ${venue}. Approval might be denied.` } : { msg: 'No conflict detected.' },
      currentStage: 'council', // Next up in chain
      chain: []
    });

    return event;
  }

  async getPendingRequests(role, departmentId) {
    if (role === 'council') {
      return EventRequest.find({ currentStage: 'council' })
        .populate('requestedBy', 'name email subRole')
        .sort({ startTime: 1 });
    }
    // If HOD, fetch all pending in HOD stage within department
    if (role === 'hod') {
      return EventRequest.find({ currentStage: 'hod', departmentId })
        .populate('requestedBy', 'name email subRole')
        .sort({ startTime: 1 });
    }
    // If Dean, fetch all events pending final dean approval across system
    if (role === 'dean') {
      return EventRequest.find({ currentStage: 'dean' })
        .populate('requestedBy', 'name email subRole')
        .populate('departmentId', 'name')
        .sort({ startTime: 1 });
    }
    return [];
  }

  async processApproval(eventId, actorUser, status, comment) {
    const event = await EventRequest.findById(eventId);
    if (!event) throw { status: 404, message: 'Event not found' };

    // Record the trace
    event.chain.push({
      role: actorUser.role,
      userId: actorUser.userId,
      status,
      comment,
      timestamp: new Date()
    });

    if (status === 'rejected') {
      event.currentStage = 'rejected';
    } else if (status === 'approved') {
      if (actorUser.role === 'council') {
        event.currentStage = 'hod';
      } else if (actorUser.role === 'hod') {
        // HOD approves -> send to Dean for final
        event.currentStage = 'dean';
      } else if (actorUser.role === 'dean') {
        // Dean approves -> Fully live
        event.currentStage = 'approved';
      }
    }

    await event.save();
    return event;
  }

  async getMyEvents(studentId) {
    return EventRequest.find({ requestedBy: studentId }).sort({ createdAt: -1 });
  }
}

export const eventService = new EventService();
