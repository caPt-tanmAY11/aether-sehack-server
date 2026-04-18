import axios from 'axios';
import { User, Department, Subject, Room, Timetable, Attendance, SyllabusProgress, Issue, EventRequest } from './src/shared.js';
import { server } from './src/index.js';

const PORT = 4000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function testPhase10() {
  console.log('--- Aether Phase 10: Analytics Dashboard Testing ---');
  process.env.REDIS_URL = 'mock';
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    console.log('[1] Cleaning & Seeding Demo Dataset...');
    await Promise.all([
      User.deleteMany({}), Department.deleteMany({}), Subject.deleteMany({}),
      Attendance.deleteMany({}), SyllabusProgress.deleteMany({}),
      Issue.deleteMany({}), EventRequest.deleteMany({})
    ]);

    const dept = await Department.create({ name: 'Engineering', code: 'ENG' });

    // Accounts
    const hodRes = await axios.post(`${BASE_URL}/auth/register`, { name: 'Dr. HOD', email: 'hod@ae.edu', password: 'password123', role: 'hod', departmentId: dept._id.toString() });
    const deanRes = await axios.post(`${BASE_URL}/auth/register`, { name: 'Dr. Dean', email: 'dean@ae.edu', password: 'password123', role: 'dean', departmentId: dept._id.toString() });
    const facRes = await axios.post(`${BASE_URL}/auth/register`, { name: 'Fac Smith', email: 'fac@ae.edu', password: 'password123', role: 'faculty', departmentId: dept._id.toString() });
    const stuRes = await axios.post(`${BASE_URL}/auth/register`, { name: 'Stu Jones', email: 'stu@ae.edu', password: 'password123', role: 'student', departmentId: dept._id.toString(), division: 'A' });
    const hodToken = hodRes.data.data.accessToken;
    const deanToken = deanRes.data.data.accessToken;
    const stuId = stuRes.data.data.user._id;
    const facId = facRes.data.data.user._id;

    const subject = await Subject.create({ name: 'Algorithms', code: 'CS301', departmentId: dept._id, credits: 4, semester: 3 });

    // Seed Attendance record
    await Attendance.create({
      timetableSlotRef: { timetableId: dept._id, day: 'Monday', startTime: '09:00' },
      subjectId: subject._id, facultyId: facId, departmentId: dept._id,
      division: 'A', date: new Date('2026-10-01'),
      records: [{ studentId: stuId, status: 'present' }]
    });

    // Seed Syllabus tracker
    await SyllabusProgress.create({
      subjectId: subject._id, facultyId: facId, departmentId: dept._id,
      semester: 3, academicYear: '2026-2027',
      topics: [{ name: 'Sorting', status: 'done' }, { name: 'Graphs', status: 'pending' }]
    });

    // Seed Issues
    await Issue.create({ reportedBy: stuId, title: 'AC broken', description: 'AC not working in Lab 2', category: 'maintenance', status: 'open' });
    await Issue.create({ reportedBy: stuId, title: 'Projector issue', description: 'Projector bulb blown', category: 'it', status: 'resolved' });

    console.log('[2] Testing HOD Dashboard...');
    const hodDash = await axios.get(`${BASE_URL}/analytics/hod/dashboard?academicYear=2026-2027`, { headers: { Authorization: `Bearer ${hodToken}` } });
    const hd = hodDash.data.data;
    console.log(`✅ HOD Dashboard received!`);
    console.log(`   Attendance: ${hd.attendance.overallPercent}% | Sessions: ${hd.attendance.totalSessions}`);
    console.log(`   Syllabus Avg: ${hd.syllabus.averageCompletion}%`);
    console.log(`   Issues Open: ${hd.issues.open} | Resolved: ${hd.issues.resolved}`);

    console.log('[3] Testing Dean Dashboard...');
    const deanDash = await axios.get(`${BASE_URL}/analytics/dean/dashboard`, { headers: { Authorization: `Bearer ${deanToken}` } });
    const dd = deanDash.data.data;
    console.log(`✅ Dean Dashboard received!`);
    console.log(`   Total Students: ${dd.totalStudents} | Faculty: ${dd.totalFaculty}`);
    console.log(`   College Issues — Open: ${dd.issues.open}, Resolved: ${dd.issues.resolved}`);

    console.log('[4] Testing granular attendance endpoint...');
    const att = await axios.get(`${BASE_URL}/analytics/attendance`, { headers: { Authorization: `Bearer ${hodToken}` } });
    console.log(`✅ Attendance stats: ${att.data.data.overallPercent}% overall, ${att.data.data.studentsBelow75} students below 75%`);

    console.log('\n✅✅ Phase 10 Analytics tests passed!');
  } catch (error) {
    if (error.response) console.error('❌ API Request Failed:', error.response.status, error.response.data);
    else console.error('❌ Test Execution Failed:', error.message);
  } finally {
    console.log('Shutting down server...');
    server.close();
    process.exit(0);
  }
}

testPhase10();
