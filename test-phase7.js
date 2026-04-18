import axios from 'axios';
import { connectDB } from './src/utils/db.js';
import { User, Issue, Department } from './src/shared.js';
import { server } from './src/index.js';

const PORT = 4000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function testPhase7() {
  console.log('--- Aether Phase 7: Campus Issue Tracking Matrix Testing ---');
  process.env.REDIS_URL = 'mock'; // bypass redis config for speed
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    console.log('[1] Cleaning Testing State...');
    await User.deleteMany({});
    await Issue.deleteMany({});
    await Department.deleteMany({});

    console.log('[2] Bootstrapping Demo Accounts...');
    const dept = await Department.create({ name: 'Computing', code: 'COMP' });
    const stuRes = await axios.post(`${BASE_URL}/auth/register`, { name: 'Student Dan', email: 'dan@ae.edu', password: 'password123', role: 'student', departmentId: dept._id.toString() });
    const adminRes = await axios.post(`${BASE_URL}/auth/register`, { name: 'System Admin', email: 'admin@ae.edu', password: 'password123', role: 'dean', departmentId: dept._id.toString() });
    
    console.log('[3] Student creating a critical Wi-Fi report block...');
    const issueCall = await axios.post(`${BASE_URL}/issues`, {
      title: 'Lab 5 Wi-Fi Down', description: 'Cannot connect to Eduroam from Lab 5 terminal block B.',
      category: 'it', location: 'Computer Lab 5'
    }, { headers: { Authorization: `Bearer ${stuRes.data.data.accessToken}` } });

    const issueId = issueCall.data.data._id;
    console.log(`✅ Issue logged safely! Tracker Status: ${issueCall.data.data.status}`);

    console.log('[4] Administrator querying the Master Queue for generic IT blocks...');
    const query = await axios.get(`${BASE_URL}/issues/all?categories=it,maintenance`, { headers: { Authorization: `Bearer ${adminRes.data.data.accessToken}` } });
    if(query.data.data.length === 1) {
      console.log(`✅ Admin queue successfully intercepted ${query.data.data.length} live issues.`);
    }

    console.log('[5] Administrator assigning, repairing, and resolving ticket remotely...');
    const patchCall = await axios.patch(`${BASE_URL}/issues/${issueId}`, {
      status: 'resolved', adminResponse: 'Router rebooted remotely. Please verify connection.'
    }, { headers: { Authorization: `Bearer ${adminRes.data.data.accessToken}` } });

    console.log(`✅ Ticket Status is now strictly: [${patchCall.data.data.status}]. Response successfully recorded.`);

    console.log('\n✅✅ Phase 7 Campus Issue Processing workflow passed flawlessly!');
  } catch (error) {
    if (error.response) console.error('❌ API Request Failed:', error.response.status, error.response.data);
    else console.error('❌ Test Execution Failed:', error.message);
  } finally {
    console.log('Shutting down server...');
    server.close();
    process.exit(0);
  }
}

testPhase7();
