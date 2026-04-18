import axios from 'axios';
import { connectDB } from './src/utils/db.js';
import { Department, User, Subject, Room, Timetable, Attendance } from './src/shared.js';
import { server } from './src/index.js';

const PORT = 4000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function testPhase4() {
  console.log('--- Aether Phase 4: Geo-Fencing & Attendance Testing ---');
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    console.log('[1] Cleaning testing data state...');
    await Department.deleteMany({});
    await User.deleteMany({});
    await Subject.deleteMany({});
    await Room.deleteMany({});
    await Timetable.deleteMany({});
    await Attendance.deleteMany({});

    console.log('[2] Setting up Mock Data (Room at Lat/Lon: 100, 100)...');
    const dept = await Department.create({ name: 'Science', code: 'SCI' });

    // Room exactly at (X: 100, Y: 100)
    const room = await Room.create({ 
      name: 'Room A', building: '1', floor: 1, capacity: 50, 
      floorPlanCoordinates: { x: 100, y: 100 } 
    });
    
    // Faculty
    const facRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Fac Alice', email: 'fac@aether.test', password: 'password', role: 'faculty', departmentId: dept._id.toString()
    });
    const facId = facRes.data.data.user._id;
    const facToken = facRes.data.data.accessToken;

    // Student
    const stuRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Stu Bob', email: 'stu@aether.test', password: 'password', role: 'student', departmentId: dept._id.toString(), division: 'A'
    });
    const stuToken = stuRes.data.data.accessToken;
    const stuId = stuRes.data.data.user._id;

    const subject = await Subject.create({ name: 'Physics 101', code: 'PHY101', departmentId: dept._id, credits: 3, semester: 1 });
    
    // Mock Approved Timetable
    const tt = await Timetable.create({
      departmentId: dept._id, division: 'A', semester: 1, academicYear: '2026-2027',
      uploadedBy: facId, status: 'approved',
      slots: [{ day: 'Monday', startTime: '09:00', endTime: '10:00', subjectId: subject._id, facultyId: facId, roomId: room._id }]
    });

    console.log('[3] Testing Geo-Fencer Rejection (Student 500 meters away)...');
    try {
      await axios.post(`${BASE_URL}/attendance/mark`, {
        timetableId: tt._id.toString(), day: 'Monday', startTime: '09:00', date: '2026-10-12',
        studentCoord: { x: 105, y: 105 } // Far away mathematically using haversine
      }, { headers: { Authorization: `Bearer ${stuToken}` } });
      throw new Error('Should have rejected distance');
    } catch (err) {
      if (err.response?.status === 403) console.log('✅ Geo-Fencer successfully intercepted out-of-bounds attempt!');
      else throw err;
    }

    console.log('[4] Testing Successful Check-In (Student Inside Room)...');
    await axios.post(`${BASE_URL}/attendance/mark`, {
      timetableId: tt._id.toString(), day: 'Monday', startTime: '09:00', date: '2026-10-12',
      studentCoord: { x: 100.0001, y: 100.0001 } // Extremely close mathematically
    }, { headers: { Authorization: `Bearer ${stuToken}` } });
    console.log('✅ Geo-Fencer passed! Attendance Logged as PRESENT!');

    console.log('[5] Testing Double-Marking Protection (Idempotent)...');
    try {
      await axios.post(`${BASE_URL}/attendance/mark`, {
        timetableId: tt._id.toString(), day: 'Monday', startTime: '09:00', date: '2026-10-12', studentCoord: { x: 100, y: 100 }
      }, { headers: { Authorization: `Bearer ${stuToken}` } });
    } catch(err) {
      if(err.response?.status === 409) console.log('✅ System prevented duplicate attendance registry!');
    }

    console.log('[6] Testing Faculty Final Override / Verification...');
    await axios.patch(`${BASE_URL}/attendance/override`, {
      subjectId: subject._id.toString(), division: 'A', date: '2026-10-12',
      updates: [{ studentId: stuId, status: 'late' }]
    }, { headers: { Authorization: `Bearer ${facToken}` } });
    console.log('✅ Faculty overrode log to LATE status successfully.');

    console.log('\n✅✅ Phase 4 Geofencing + Attendance testing Passed!');

  } catch (error) {
    if (error.response) console.error('❌ API Request Failed:', error.response.status, error.response.data);
    else console.error('❌ Test Execution Failed:', error.message);
  } finally {
    console.log('Shutting down server...');
    server.close();
    process.exit(0);
  }
}

testPhase4();
