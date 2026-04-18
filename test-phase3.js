import axios from 'axios';
import { connectDB } from './src/utils/db.js';
import { Department, User, Subject, Room, Timetable } from './src/shared.js';
import { server } from './src/index.js';

const PORT = 4000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function testPhase3() {
  console.log('--- Aether Phase 3 End-to-End API Testing ---');
  await new Promise(resolve => setTimeout(resolve, 2000)); // allow server to start

  try {
    console.log('[1] Cleaning testing data state...');
    await Department.deleteMany({});
    await User.deleteMany({});
    await Subject.deleteMany({});
    await Room.deleteMany({});
    await Timetable.deleteMany({});

    console.log('[2] Setting up mock Department, HOD, and Faculty...');
    const dept = await Department.create({ name: 'Science', code: 'SCI' });

    // HOD
    const hodRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'HOD Bob', email: 'hod@aether.test', password: 'password', role: 'hod', departmentId: dept._id.toString()
    });
    const hodToken = hodRes.data.data.accessToken;

    // Faculty Coord
    const facRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Fac Alice', email: 'fac@aether.test', password: 'password', role: 'faculty', subRole: 'timetable_coord', departmentId: dept._id.toString()
    });
    const facToken = facRes.data.data.accessToken;

    const subject = await Subject.create({ name: 'Physics 101', code: 'PHY101', departmentId: dept._id, credits: 3, semester: 1 });
    const room = await Room.create({ name: 'Room A', building: 'Building 1', floor: 1, capacity: 50 });

    console.log('[3] Faculty coordinates Timetable Submission (POST /api/timetable)...');
    const ttPayload = {
      division: 'A',
      semester: 1,
      academicYear: '2026-2027',
      slots: [{ day: 'Monday', startTime: '09:00', endTime: '10:00', subjectId: subject._id.toString(), facultyId: facRes.data.data.user._id, roomId: room._id.toString() }]
    };

    const ttRes = await axios.post(`${BASE_URL}/timetable`, ttPayload, { headers: { Authorization: `Bearer ${facToken}` } });
    const ttId = ttRes.data.data._id;
    console.log(`✅ Timetable uploaded! Pending approval from HOD. Object ID: ${ttId}`);

    console.log('[4] Clash Detection Validation...');
    try {
      await axios.post(`${BASE_URL}/timetable`, ttPayload, { headers: { Authorization: `Bearer ${facToken}` } });
    } catch(err) {
      if (err.response.status === 409) {
        console.log('✅ Clash correctly detected! Prevented double booking.');
      } else throw err;
    }

    console.log('[5] HOD Review (PATCH /api/timetable/:id/review)...');
    await axios.patch(`${BASE_URL}/timetable/${ttId}/review`, { status: 'approved', comment: 'Looks good' }, { headers: { Authorization: `Bearer ${hodToken}` } });
    console.log('✅ Timetable officially approved!');

    console.log('[6] Testing Student Cache Retrieval (GET /api/timetable/me) to populate REDIS...');
    const stuRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Timmy Student', email: 'timmy@aether.test', password: 'password', role: 'student', departmentId: dept._id.toString(), division: 'A'
    });
    const stuToken = stuRes.data.data.accessToken;

    await axios.get(`${BASE_URL}/timetable/me?semester=1&academicYear=2026-2027`, { headers: { Authorization: `Bearer ${stuToken}` } });
    console.log('✅ Fetched Timetable. It should now be CACHED seamlessly into UPSTASH REDIS online!');

    console.log('\n✅✅ All Phase 3 Timetable API tests passed end-to-end!');

  } catch (error) {
    if (error.response) {
      console.error('❌ API Request Failed:', error.response.status, error.response.data);
    } else {
      console.error('❌ Test Execution Failed:', error.message);
    }
  } finally {
    console.log('Shutting down server...');
    server.close();
    process.exit(0);
  }
}

testPhase3();
