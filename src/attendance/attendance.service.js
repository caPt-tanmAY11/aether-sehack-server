import { Attendance, Timetable, User } from '../shared.js';
import { verifyGeoFence } from './geo.util.js';
import mongoose from 'mongoose';

class AttendanceService {
  async markStudentSelf(studentId, data) {
    const { timetableId, day, startTime, studentCoord, date } = data;
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') throw { status: 403, message: 'Students only' };

    const timetable = await Timetable.findById(timetableId).populate('slots.roomId');
    if (!timetable) throw { status: 404, message: 'Timetable not found' };

    const slot = timetable.slots.find(s => s.day === day && s.startTime === startTime);
    if (!slot) throw { status: 404, message: 'Slot not found' };

    // Geo-fence validation
    if (slot.roomId && slot.roomId.floorPlanCoordinates) {
      const isValid = verifyGeoFence(studentCoord, slot.roomId.floorPlanCoordinates, 50);
      if (!isValid) throw { status: 403, message: 'Out of perimeter range. Must be near the classroom.' };
    }

    const testDate = new Date(date);
    testDate.setHours(0, 0, 0, 0);

    // Upsert the session for the day
    let session = await Attendance.findOne({
      subjectId: slot.subjectId,
      facultyId: slot.facultyId,
      division: timetable.division,
      date: testDate
    });

    if (!session) {
      session = new Attendance({
        timetableSlotRef: { timetableId, day, startTime },
        subjectId: slot.subjectId,
        facultyId: slot.facultyId,
        departmentId: timetable.departmentId,
        division: timetable.division,
        date: testDate,
        records: []
      });
    }

    const existingIndex = session.records.findIndex(r => r.studentId.toString() === studentId.toString());
    if (existingIndex > -1) {
      throw { status: 409, message: 'Attendance already marked for this session' };
    }

    session.records.push({ studentId, status: 'present' });
    await session.save();

    return session;
  }

  async facultyOverride(facultyId, data) {
    const { subjectId, division, date, updates } = data;
    const testDate = new Date(date);
    testDate.setHours(0, 0, 0, 0);

    let session = await Attendance.findOne({
      subjectId,
      facultyId,
      division,
      date: testDate
    });

    if (!session) throw { status: 404, message: 'Session block does not exist for this date' };

    // Apply overrides
    for (const update of updates) {
      const idx = session.records.findIndex(r => r.studentId.toString() === update.studentId);
      if (idx > -1) {
        session.records[idx].status = update.status;
      } else {
        session.records.push({ studentId: update.studentId, status: update.status });
      }
    }

    await session.save();
    return session;
  }

  async getStudentReport(studentId, departmentId) {
    const records = await Attendance.find({
      departmentId,
      'records.studentId': studentId
    }).populate('subjectId', 'name code');

    let totalClasses = 0;
    let attendedClasses = 0;

    const breakdown = records.reduce((acc, session) => {
      const rec = session.records.find(r => r.studentId.toString() === studentId.toString());
      if (!rec) return acc;
      
      const subName = session.subjectId.name;
      if (!acc[subName]) acc[subName] = { total: 0, attended: 0 };
      
      acc[subName].total += 1;
      totalClasses += 1;
      
      if (rec.status === 'present' || rec.status === 'late') {
        acc[subName].attended += 1;
        attendedClasses += 1;
      }
      return acc;
    }, {});

    return {
      totalPercent: totalClasses === 0 ? 0 : Math.round((attendedClasses / totalClasses) * 100),
      breakdown
    };
  }
}

export const attendanceService = new AttendanceService();
