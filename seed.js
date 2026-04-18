/**
 * AETHER — Full Database Seed Script v3
 * - Real SPIT faculty, HODs, Deans from official directory
 * - Real Student Council 2025-26 & Committees
 * - 300 mock students
 * - Rich Data: Clubs, Events, Issues, Notices, Advising Notes, Leave Requests
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './src/utils/db.js';
import { Department, User, Subject, Room, Timetable, EventRequest, Issue, Notification, SyllabusProgress, ChatbotLog } from './src/shared.js';
import { LeaveRequest } from './src/models/LeaveRequest.model.js';
import { Club } from './src/models/Club.model.js';
import { AdvisingNote } from './src/models/AdvisingNote.model.js';
import { Notice } from './src/models/Notice.model.js';

const DEFAULT_PASSWORD = await bcrypt.hash('Aether@2026', 10);

const DEPARTMENTS = [
  { name: 'Computer Engineering',            code: 'COMPS', color: '#3b82f6' },
  { name: 'Computer Science & Engineering',  code: 'CSE',   color: '#8b5cf6' },
  { name: 'Electronics & Telecommunication', code: 'EXTC',  color: '#10b981' },
];

const FACULTY_BY_DEPT = {
  COMPS: {
    hod: { name: 'Dr. Surekha Dholay', email: 'surekha_dholay@spit.ac.in' },
    faculty: [
      { name: 'Shri. Pramod Bide',      email: 'pramod_bide@spit.ac.in' },
      { name: 'Dr. K.K. Devadkar',      email: 'kailas_devadkar@spit.ac.in' },
      { name: 'Smt. Kiran Gawande',     email: 'kiran_gawande@spit.ac.in' },
    ]
  },
  CSE: {
    hod: { name: 'Dr. Sujata Kulkarni', email: 'sujata_kulkarni@spit.ac.in' },
    faculty: [
      { name: 'Shri. D.D. Ambawade',     email: 'dd_ambawade@spit.ac.in' },
      { name: 'Smt. Sheetal Chaudhari',  email: 'sheetal_chaudhari@spit.ac.in' },
      { name: 'Smt. Aparna Halbe',       email: 'aparna_halbe@spit.ac.in' },
    ]
  },
  EXTC: {
    hod: { name: 'Dr. R.G. Sutar', email: 'rajendra_sutar@spit.ac.in' },
    faculty: [
      { name: 'Smt. Manisha Bansode',  email: 'manisha_bansode@spit.ac.in' },
      { name: 'Dr. N.A. Bhagat',       email: 'narendra_bhagat@spit.ac.in' },
      { name: 'Dr. Amol Deshpande',    email: 'amol_deshpande@spit.ac.in' },
    ]
  }
};

const DEANS = [
  { name: 'Prof. Sudhir Dhage', email: 'sudhir_dhage@spit.ac.in', subRole: 'dean_admin' },
  { name: 'Prof. Y S Rao',      email: 'ysrao@spit.ac.in',         subRole: 'dean_academics' },
  { name: 'Dr. Kiran Talele',   email: 'kiran.talele@spit.ac.in',  subRole: 'dean_students' },
];

const COUNCIL_MEMBERS = [
  { name: 'Aparna Jha',                email: 'aparna.jha@student.spit.ac.in',           subRole: 'general_secretary',     dept: 'EXTC' },
  { name: 'Yash Thakkar',              email: 'yash.thakkar@student.spit.ac.in',          subRole: 'finance_secretary',     dept: 'COMPS' },
  { name: 'Harshavardhan Singh Deora', email: 'harshavardhan.deora@student.spit.ac.in',  subRole: 'sports_secretary',      dept: 'CSE' },
];

const COMMITTEES = [
  { prefix: 'ecell', dept: 'EXTC', name: 'E-Cell SPIT', desc: 'Entrepreneurship Cell' },
  { prefix: 'csi', dept: 'COMPS', name: 'CSI SPIT', desc: 'Computer Society of India Student Chapter' },
  { prefix: 'cspit', dept: 'CSE', name: 'CSPIT', desc: 'Computer Society SPIT' },
  { prefix: 'sports', dept: 'EXTC', name: 'Sports Council', desc: 'Official Sports Council' },
  { prefix: 'oculus', dept: 'COMPS', name: 'Oculus', desc: 'Annual Techno-Cultural Fest' }
];

const SUBJECTS = {
  COMPS: [
    { name: 'Data Structures',          code: 'COMPS301', credits: 4, semester: 3 },
    { name: 'Object Oriented Programming', code: 'COMPS302', credits: 4, semester: 3 },
  ],
  CSE: [
    { name: 'Machine Learning', code: 'CSE301', credits: 4, semester: 3 },
    { name: 'Database Management',   code: 'CSE302', credits: 4, semester: 3 },
  ],
  EXTC: [
    { name: 'Digital Electronics',           code: 'EXTC301', credits: 4, semester: 3 },
    { name: 'Analog Communication',          code: 'EXTC302', credits: 4, semester: 3 },
  ],
};

const ROOMS = [
  { name: 'CR-101', building: 'Main',   floor: 1, capacity: 60,  floorPlanCoordinates: { x: 19.1249, y: 72.8464 } },
  { name: 'CR-102', building: 'Main',   floor: 1, capacity: 60,  floorPlanCoordinates: { x: 19.1249, y: 72.8464 } },
  { name: 'Lab-101',building: 'Lab',    floor: 1, capacity: 30,  floorPlanCoordinates: { x: 19.1249, y: 72.8464 } },
  { name: 'Seminar Hall', building: 'Main', floor: 0, capacity: 120, floorPlanCoordinates: { x: 19.1249, y: 72.8464 } },
];

const FIRST_NAMES = ['Aarav','Aditi','Akash','Anika','Ankit','Bhavna','Chirag','Deepika','Dev'];
const LAST_NAMES = ['Sharma','Patil','Shah','Mehta','Joshi','Verma','Singh','Gupta','Kumar'];

function randomName(i, code) {
  const first = FIRST_NAMES[i % FIRST_NAMES.length];
  const last = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
  return { name: `${first} ${last}`, email: `${code.toLowerCase()}.${i + 1}@student.spit.ac.in` };
}

const SLOT_TIMES = [
  { startTime: '09:00', endTime: '10:00' },
  { startTime: '10:00', endTime: '11:00' },
  { startTime: '11:15', endTime: '12:15' },
];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function buildTimetableSlots(subjects, facultyIds, roomId) {
  const slots = [];
  let subIdx = 0;
  for (let d = 0; d < DAYS.length; d++) {
    for (let t = 0; t < SLOT_TIMES.length; t++) {
      slots.push({
        day: DAYS[d],
        startTime: SLOT_TIMES[t].startTime,
        endTime: SLOT_TIMES[t].endTime,
        subjectId: subjects[subIdx % subjects.length],
        facultyId: facultyIds[subIdx % facultyIds.length],
        roomId,
      });
      subIdx++;
    }
  }
  return slots;
}

async function seed() {
  console.log('🌱 Aether Full Database Seed v3');
  await connectDB(process.env.MONGODB_URI);

  console.log('🧹 Clearing existing data...');
  await Promise.all([
    Department.deleteMany({}), User.deleteMany({}), Subject.deleteMany({}), Room.deleteMany({}),
    Timetable.deleteMany({}), EventRequest.deleteMany({}), Issue.deleteMany({}), Notification.deleteMany({}),
    SyllabusProgress.deleteMany({}), ChatbotLog.deleteMany({}), LeaveRequest.deleteMany({}),
    Club.deleteMany({}), AdvisingNote.deleteMany({}), Notice.deleteMany({})
  ]);

  const deptDocs = {};
  for (const d of DEPARTMENTS) deptDocs[d.code] = await Department.create(d);

  const roomDocs = [];
  for (const r of ROOMS) roomDocs.push(await Room.create(r));
  const roomMap = Object.fromEntries(roomDocs.map(r => [r.name, r]));

  for (const dean of DEANS) {
    await User.create({ name: dean.name, email: dean.email, passwordHash: DEFAULT_PASSWORD, role: 'dean', subRole: dean.subRole, departmentId: deptDocs['COMPS']._id });
  }

  const allFaculty = [];
  const allStudents = [];
  const allHods = [];

  for (const [code, data] of Object.entries(FACULTY_BY_DEPT)) {
    const dept = deptDocs[code];
    const hod = await User.create({ name: data.hod.name, email: data.hod.email, passwordHash: DEFAULT_PASSWORD, role: 'hod', departmentId: dept._id });
    allHods.push(hod);

    const facultyDocs = [];
    for (let i = 0; i < data.faculty.length; i++) {
      const f = data.faculty[i];
      const doc = await User.create({
        name: f.name, email: f.email, passwordHash: DEFAULT_PASSWORD,
        role: 'faculty', departmentId: dept._id,
        subRole: i === 0 ? 'timetable_coord' : null,
      });
      facultyDocs.push(doc);
      allFaculty.push(doc);
    }

    const subjectDocs = [];
    for (const s of SUBJECTS[code]) {
      subjectDocs.push(await Subject.create({ ...s, departmentId: dept._id }));
    }

    const rooms = [roomMap['CR-101'], roomMap['CR-102']];
    for (let divIdx = 0; divIdx < 2; divIdx++) {
      const division = divIdx === 0 ? 'A' : 'B';
      const room = rooms[divIdx % rooms.length];
      const slots = buildTimetableSlots(subjectDocs.map(s => s._id), facultyDocs.map(f => f._id), room._id);
      await Timetable.create({
        departmentId: dept._id, division, semester: 3, academicYear: '2026-2027',
        uploadedBy: facultyDocs[0]._id, status: 'approved', slots,
      });
    }

    for (let i = 0; i < 100; i++) {
      const { name, email } = randomName(i, code);
      const div = i < 50 ? 'A' : 'B';
      const student = await User.create({ name, email, passwordHash: DEFAULT_PASSWORD, role: 'student', departmentId: dept._id, division: div, semester: 3, enrollmentNo: `${code}${2024}${String(i + 1).padStart(3, '0')}` });
      allStudents.push(student);
    }
  }

  const allCouncil = [];
  for (const c of COUNCIL_MEMBERS) {
    const councilMember = await User.create({ name: c.name, email: c.email, passwordHash: DEFAULT_PASSWORD, role: 'council', subRole: c.subRole, departmentId: deptDocs[c.dept]._id });
    allCouncil.push(councilMember);
  }

  const allCommitteeMembers = [];
  for (const c of COMMITTEES) {
    for (let i = 0; i < 2; i++) {
      const isHead = i === 0;
      const subRole = 'committee_head'; // Fixed to valid enum
      const name = `${c.prefix.toUpperCase()} ${isHead ? 'Chairperson' : `Vice-Chairperson`}`;
      const email = `${c.prefix}${isHead ? 'head' : `vice`}@student.spit.ac.in`;
      
      const member = await User.create({ name, email, passwordHash: DEFAULT_PASSWORD, role: 'student', subRole, departmentId: deptDocs[c.dept]._id });
      allCommitteeMembers.push(member);
    }
  }

  await User.create({ name: 'Super Admin', email: 'admin@spit.ac.in', passwordHash: DEFAULT_PASSWORD, role: 'superadmin', departmentId: deptDocs['COMPS']._id });

  console.log('🎉 Seeding Clubs...');
  const clubs = [];
  for (let i = 0; i < COMMITTEES.length; i++) {
    const c = COMMITTEES[i];
    const category = c.prefix === 'sports' ? 'sports' : (c.prefix === 'ecell' ? 'entrepreneurship' : 'technical');
    const club = await Club.create({
      name: c.name,
      description: c.desc,
      category: category,
      departmentId: deptDocs[c.dept]._id,
      facultyAdvisorId: allFaculty[i % allFaculty.length]._id,
      members: [
        { userId: allCommitteeMembers[i*2]._id, role: 'president' },
        { userId: allStudents[0]._id, role: 'member' },
        { userId: allStudents[1]._id, role: 'member' },
        { userId: allStudents[2]._id, role: 'member' }
      ]
    });
    clubs.push(club);
  }

  console.log('📣 Seeding Notices...');
  await Notice.create({
    title: 'Welcome to Aether Beta!',
    body: 'The new unified campus OS is now live. Please report any bugs.',
    publishedBy: allHods[0]._id,
    departmentId: deptDocs['COMPS']._id,
    targetDivisions: [],
    targetSemesters: []
  });
  await Notice.create({
    title: 'Mid-Term Exam Schedule Released',
    body: 'The mid-term exams will begin on Oct 15th. Please check the portal for your seating arrangements.',
    publishedBy: allFaculty[0]._id,
    departmentId: deptDocs['COMPS']._id,
    targetDivisions: ['A'],
    targetSemesters: [3]
  });

  console.log('📅 Seeding Events...');
  await EventRequest.create({
    title: 'Hackathon 2025',
    description: 'Annual 24-hour hackathon by CSI.',
    requestedBy: allCommitteeMembers[2]._id,
    expectedAttendance: 200,
    startTime: new Date(Date.now() + 86400000 * 5),
    endTime: new Date(Date.now() + 86400000 * 6),
    venue: roomMap['Seminar Hall'].name,
    departmentId: deptDocs['COMPS']._id,
    currentStage: 'approved',
    chain: [
      { role: 'hod', status: 'approved', userId: allHods[0]._id, comment: 'Looks good' },
      { role: 'dean', status: 'approved', userId: null, comment: 'Approved' }
    ]
  });
  await EventRequest.create({
    title: 'Guest Lecture on AI',
    description: 'Lecture by industry expert on the future of GenAI.',
    requestedBy: allCommitteeMembers[4]._id,
    expectedAttendance: 50,
    startTime: new Date(Date.now() + 86400000 * 10),
    endTime: new Date(Date.now() + 86400000 * 10 + 3600000 * 2),
    venue: roomMap['CR-101'].name,
    departmentId: deptDocs['COMPS']._id,
    currentStage: 'hod',
    chain: []
  });

  console.log('🛠️ Seeding Issues...');
  await Issue.create({
    title: 'Projector not working in CR-101',
    description: 'The HDMI cable seems broken. Color is flickering.',
    category: 'maintenance',
    locationDesc: 'CR-101',
    reportedBy: allStudents[0]._id,
    status: 'open',
  });
  await Issue.create({
    title: 'WiFi Down in Lab 1',
    description: 'Unable to connect to the student network since morning.',
    category: 'it',
    locationDesc: 'Lab-101',
    reportedBy: allStudents[3]._id,
    status: 'in_progress',
  });

  console.log('📝 Seeding Advising Notes...');
  await AdvisingNote.create({
    studentId: allStudents[0]._id,
    facultyId: allFaculty[0]._id,
    title: 'Mid-Term Review',
    note: 'Student is performing well but needs to focus more on Data Structures.',
    category: 'academic',
    visibility: 'shared',
    requiresFollowUp: true,
    followUpDate: new Date(Date.now() + 86400000 * 7)
  });

  console.log('🏖️ Seeding Leave Requests...');
  await LeaveRequest.create({
    facultyId: allFaculty[1]._id,
    departmentId: deptDocs['COMPS']._id,
    leaveType: 'casual',
    fromDate: new Date(Date.now() + 86400000 * 2),
    toDate: new Date(Date.now() + 86400000 * 3),
    reason: 'Attending a family function.',
    status: 'pending'
  });

  console.log('\n✅ Seed Complete!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(e => { console.error('❌ Seed failed:', e.message); process.exit(1); });
