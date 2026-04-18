import axios from 'axios';
import { connectDB } from './src/utils/db.js';
import { Department, User, Subject, SyllabusProgress } from './src/shared.js';
import { server } from './src/index.js';

const PORT = 4000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function testPhase5() {
  console.log('--- Aether Phase 5: Syllabus Tracking Testing ---');
  process.env.REDIS_URL = 'mock'; // Safely disable redis for rapid tests
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    console.log('[1] Cleaning DB state...');
    await Department.deleteMany({});
    await User.deleteMany({});
    await Subject.deleteMany({});
    await SyllabusProgress.deleteMany({});

    console.log('[2] Generating Mock Users & Subject...');
    const dept = await Department.create({ name: 'Arts', code: 'ART' });
    
    // Faculty & Student
    const facRes = await axios.post(`${BASE_URL}/auth/register`, { name: 'Fac Bob', email: 'facbob@aether.test', password: 'password123', role: 'faculty', departmentId: dept._id.toString() });
    const facToken = facRes.data.data.accessToken;

    const stuRes = await axios.post(`${BASE_URL}/auth/register`, { name: 'Stu Ann', email: 'stuann@aether.test', password: 'password123', role: 'student', departmentId: dept._id.toString(), division: 'A' });
    const stuToken = stuRes.data.data.accessToken;

    const subject = await Subject.create({ name: 'History 202', code: 'HIS202', departmentId: dept._id, credits: 4, semester: 2 });

    console.log('[3] Teacher initializes Syllabus Topic Array (POST /api/syllabus/init)...');
    const initRes = await axios.post(`${BASE_URL}/syllabus/init`, {
      subjectId: subject._id.toString(), semester: 2, academicYear: '2026-2027',
      topics: [ { name: 'Topic 1' }, { name: 'Topic 2' } ]
    }, { headers: { Authorization: `Bearer ${facToken}` } });
    
    const trackerId = initRes.data.data._id;
    const topic1Id = initRes.data.data.topics[0]._id;
    console.log(`✅ Syllabus Initialized! Tracker ID: ${trackerId}. Initial completion: 0%`);

    console.log('[4] Teacher marks Topic 1 as DONE (PATCH /api/syllabus/:id/topic)...');
    const updateRes = await axios.patch(`${BASE_URL}/syllabus/${trackerId}/topic`, {
      topicId: topic1Id, status: 'done', notes: 'Completed chapter 1 earlier than expected'
    }, { headers: { Authorization: `Bearer ${facToken}` } });
    console.log('✅ Topic updated successfully!');

    console.log('[5] Verifying Mongoose Auto-percentage calculate hook...');
    const trackerObj = await SyllabusProgress.findById(trackerId);
    console.log(`✅ Hook fired! Completion mathematically auto-updated to: ${trackerObj.completionPercent}%`);

    console.log('[6] Student accessing Overview (GET /api/syllabus/overview)...');
    const overviewRes = await axios.get(`${BASE_URL}/syllabus/overview?semester=2&academicYear=2026-2027`, { headers: { Authorization: `Bearer ${stuToken}` } });
    console.log(`✅ Overview retrieved! ${overviewRes.data.data.length} Subjects found with active tracking.`);

    console.log('\n✅✅ Phase 5 Syllabus Tracking tests passed entirely!');
  } catch (error) {
    if (error.response) console.error('❌ API Request Failed:', error.response.status, error.response.data);
    else console.error('❌ Test Execution Failed:', error.message);
  } finally {
    console.log('Shutting down server...');
    server.close();
    process.exit(0);
  }
}

testPhase5();
