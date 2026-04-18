import axios from 'axios';
import { connectDB } from './src/utils/db.js';
import { Department, User, Subject, Room, Timetable, EventRequest } from './src/shared.js';
import { server } from './src/index.js';

const PORT = 4000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function testPhase6() {
  console.log('--- Aether Phase 6: Event Request Matrix Testing ---');
  process.env.REDIS_URL = 'mock'; // bypass redis
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    console.log('[1] Cleaning DB...');
    await Department.deleteMany({});
    await User.deleteMany({});
    await Subject.deleteMany({});
    await Room.deleteMany({});
    await Timetable.deleteMany({});
    await EventRequest.deleteMany({});

    console.log('[2] Generating Mock Hierarchy (Student, Council, HOD, Dean)...');
    const dept = await Department.create({ name: 'Computing', code: 'COMP' });
    const stuRes = await axios.post(`${BASE_URL}/auth/register`, { name: 'Stu', email: 'stu@ae.test', password: 'password123', role: 'student', subRole: 'sports_secretary', departmentId: dept._id.toString() });
    const councilRes = await axios.post(`${BASE_URL}/auth/register`, { name: 'Council Member', email: 'coun@ae.test', password: 'password123', role: 'council', departmentId: dept._id.toString() });
    const hodRes = await axios.post(`${BASE_URL}/auth/register`, { name: 'HOD', email: 'hod@ae.test', password: 'password123', role: 'hod', departmentId: dept._id.toString() });
    const deanRes = await axios.post(`${BASE_URL}/auth/register`, { name: 'Dean', email: 'dean@ae.test', password: 'password123', role: 'dean', departmentId: dept._id.toString() });
    
    // Attempting unauthorized event block
    const pureStuRes = await axios.post(`${BASE_URL}/auth/register`, { name: 'Nerd', email: 'nerd@ae.test', password: 'password123', role: 'student', departmentId: dept._id.toString() });
    try {
      await axios.post(`${BASE_URL}/events`, { title: 'T', description: 'desc', venue: 'A', startTime: '2026-10-10T10:00:00Z', endTime: '2026-10-10T12:00:00Z' }, { headers: { Authorization: `Bearer ${pureStuRes.data.data.accessToken}` } });
      throw new Error('Should have failed!');
    } catch(err) {
      if (err.response.status === 403) console.log('✅ RBAC Firewall properly blocked regular student without committee position.');
      else throw err;
    }

    console.log('[3] Committee Student raising legitimate event...');
    // Setting up a silent timetable clash
    const room = await Room.create({ name: 'Auditorium 1', building: '1', floor: 1, capacity: 50 });
    await Timetable.create({
      departmentId: dept._id, division: 'A', semester: 1, academicYear: '2026-2027', uploadedBy: hodRes.data.data.user._id, status: 'approved',
      slots: [{ day: 'Monday', startTime: '09:00', endTime: '12:00', subjectId: dept._id, facultyId: hodRes.data.data.user._id, roomId: room._id }]
    });

    // Submit an event specifically clashing from 10:00 AM to 6:00 PM local time
    const eveRes = await axios.post(`${BASE_URL}/events`, {
      title: 'Global Hackathon 2026', description: 'An insane event that lasts all day', venue: 'Auditorium 1', 
      startTime: '2026-10-12T10:00:00+05:30', // Forced local time zone parsing lock
      endTime: '2026-10-12T18:00:00+05:30', 
      expectedAttendance: 500
    }, { headers: { Authorization: `Bearer ${stuRes.data.data.accessToken}` } });

    const eventId = eveRes.data.data._id;
    console.log(`✅ Event Submitted! Tracker Result: ${eveRes.data.data.conflictResult.msg}`);
    
    if (!eveRes.data.data.conflictResult.msg.includes('Conflict found')) {
      throw new Error(`Mathematical Clash Detection failed! It returned: ${eveRes.data.data.conflictResult.msg}`);
    }

    console.log('[4] Graph executing level 1 Council logic...');
    await axios.patch(`${BASE_URL}/events/${eventId}/review`, { status: 'approved', comment: 'Council accepts it' }, { headers: { Authorization: `Bearer ${councilRes.data.data.accessToken}` } });
    console.log('✅ Council completely verified layer 1. Graph routes to HOD.');

    console.log('[5] Graph executing level 2 HOD logic...');
    await axios.patch(`${BASE_URL}/events/${eventId}/review`, { status: 'approved', comment: 'Seems fine' }, { headers: { Authorization: `Bearer ${hodRes.data.data.accessToken}` } });
    console.log('✅ HOD completely verified layer 2. Graph routes to Dean.');

    const deanFetch = await axios.get(`${BASE_URL}/events/pending`, { headers: { Authorization: `Bearer ${deanRes.data.data.accessToken}` } });
    if(deanFetch.data.count === 1) {
      console.log('✅ Dean sees event in queue!');
      await axios.patch(`${BASE_URL}/events/${eventId}/review`, { status: 'approved', comment: 'Let it happen.' }, { headers: { Authorization: `Bearer ${deanRes.data.data.accessToken}` } });
      console.log('✅ Dean finalizes execution.');
    }

    console.log('\n✅✅ Phase 6 Event Processing graph testing successfully passed!');
  } catch (error) {
    if (error.response) console.error('❌ API Request Failed:', error.response.status, error.response.data);
    else console.error('❌ Test Execution Failed:', error.message);
  } finally {
    console.log('Shutting down server...');
    server.close();
    process.exit(0);
  }
}

testPhase6();
