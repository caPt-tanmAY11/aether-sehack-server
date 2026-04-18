import { SyllabusProgress, Subject, cacheDel } from '../shared.js';
import mongoose from 'mongoose';

class SyllabusService {
  /**
   * Faculty initializes the syllabus map for a subject they teach.
   */
  async initializeSyllabus(facultyId, departmentId, payload) {
    const { subjectId, semester, academicYear, topics } = payload;
    
    // Check if sub exists
    const subject = await Subject.findById(subjectId);
    if (!subject || subject.departmentId.toString() !== departmentId) {
      throw { status: 404, message: 'Subject not found in your department' };
    }

    const existing = await SyllabusProgress.findOne({
      facultyId, subjectId, academicYear
    });

    if (existing) {
      throw { status: 409, message: 'Syllabus tracker already initialized for this academic year' };
    }

    const tracker = await SyllabusProgress.create({
      subjectId: new mongoose.Types.ObjectId(subjectId),
      facultyId: new mongoose.Types.ObjectId(facultyId),
      departmentId: new mongoose.Types.ObjectId(departmentId),
      semester,
      academicYear,
      topics
    });

    return tracker;
  }

  /**
   * Mark a specific topic as done.
   */
  async updateTopicCompletion(facultyId, trackerId, topicId, status, notes) {
    const tracker = await SyllabusProgress.findById(trackerId);
    if (!tracker) throw { status: 404, message: 'Tracker not found' };
    
    if (tracker.facultyId.toString() !== facultyId) {
      throw { status: 403, message: 'You can only update trackers assigned to you' };
    }

    const topic = tracker.topics.id(topicId);
    if (!topic) throw { status: 404, message: 'Topic not found in syllabus' };

    topic.status = status;
    if (status === 'done') topic.completedAt = new Date();
    if (notes !== undefined) topic.notes = notes;

    // The 'pre-save' hook in the Mongoose schema dynamically calculates the completionPercent mathematically
    await tracker.save();

    return tracker;
  }

  /**
   * Get progress for students
   */
  async getStudentProgressOverview(departmentId, semester, academicYear) {
    const trackers = await SyllabusProgress.find({
      departmentId, semester, academicYear
    }).populate('subjectId', 'name code').populate('facultyId', 'name');
    
    return trackers;
  }
}

export const syllabusService = new SyllabusService();
