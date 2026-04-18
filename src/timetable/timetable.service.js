import { Timetable, User, cacheGet, cacheSet, cacheDel } from '../shared.js';
import { detectTimetableClashes } from './clashDetection.util.js';
import mongoose from 'mongoose';

const CACHE_TTL = 600;  // 10 minutes

class TimetableService {
  async upload(data) {
    // Get all existing APPROVED timetables for this dept/division/semester
    const existing = await Timetable.find({
      departmentId: data.departmentId,
      division: data.division,
      semester: data.semester,
      academicYear: data.academicYear,
      status: 'approved',
    });

    // Build list of all existing approved slots across sections
    const existingSlots = existing.flatMap(t => 
      t.slots.map(s => ({
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
        facultyId: s.facultyId.toString(),
        roomId: s.roomId.toString(),
      }))
    );

    const incomingSlots = data.slots.map(s => ({
      day: s.day,
      startTime: s.startTime,
      endTime: s.endTime,
      facultyId: s.facultyId.toString(),
      roomId: s.roomId.toString(),
    }));

    const clashResult = detectTimetableClashes(incomingSlots, existingSlots);

    if (clashResult.hasClash) {
      throw {
        status: 409,
        message: 'Timetable has scheduling conflicts',
        data: clashResult,
      };
    }

    const timetable = await Timetable.create({
      ...data,
      departmentId: new mongoose.Types.ObjectId(data.departmentId),
      uploadedBy: new mongoose.Types.ObjectId(data.uploadedBy),
      status: 'pending',
    });

    return timetable;
  }

  async getPendingForHOD(hodId) {
    const hodUser = await User.findById(hodId);
    if (!hodUser) throw { status: 404, message: 'HOD not found' };

    return Timetable.find({
      departmentId: hodUser.departmentId,
      status: 'pending',
    }).populate('uploadedBy', 'name email')
      .populate('slots.subjectId', 'name code')
      .populate('slots.facultyId', 'name')
      .populate('slots.roomId', 'name building floor')
      .sort({ createdAt: -1 });
  }

  async approveOrReject(timetableId, hodId, action, comment) {
    const timetable = await Timetable.findById(timetableId);
    if (!timetable) throw { status: 404, message: 'Timetable not found' };
    if (timetable.status !== 'pending') throw { status: 400, message: 'Already processed' };

    const hod = await User.findById(hodId);
    if (!hod || hod.departmentId.toString() !== timetable.departmentId.toString()) {
      throw { status: 403, message: 'Not authorized for this department' };
    }

    timetable.status = action;
    timetable.hodComment = comment;
    if (action === 'approved') timetable.approvedAt = new Date();
    await timetable.save();

    await cacheDel(`timetable:dept:${timetable.departmentId}:div:${timetable.division}:sem:${timetable.semester}`);

    return timetable;
  }

  async getForStudent(departmentId, division, semester, academicYear) {
    const cacheKey = `timetable:dept:${departmentId}:div:${division}:sem:${semester}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const timetable = await Timetable.findOne({
      departmentId, division, semester, academicYear, status: 'approved'
    }).populate('slots.subjectId', 'name code')
      .populate('slots.facultyId', 'name')
      .populate('slots.roomId', 'name building floor floorPlanCoordinates');

    if (timetable) await cacheSet(cacheKey, timetable, CACHE_TTL);

    return timetable;
  }

  async getForFaculty(facultyId) {
    const cacheKey = `timetable:faculty:${facultyId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const timetables = await Timetable.find({
      'slots.facultyId': new mongoose.Types.ObjectId(facultyId),
      status: 'approved',
    }).populate('slots.subjectId', 'name code')
      .populate('slots.roomId', 'name building floor');

    await cacheSet(cacheKey, timetables, CACHE_TTL);
    return timetables;
  }

  async getAllForDept(departmentId) {
    return Timetable.find({ departmentId, status: 'approved' })
      .populate('slots.subjectId', 'name code')
      .populate('slots.facultyId', 'name')
      .populate('slots.roomId', 'name building floor');
  }
}

export const timetableService = new TimetableService();
