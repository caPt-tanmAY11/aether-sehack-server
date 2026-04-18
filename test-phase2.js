import axios from 'axios';
import { connectDB } from './src/utils/db.js';
import { Department, User } from './src/shared.js';
import { server } from './src/index.js';

const PORT = process.env.PORT || 4000;
const BASE_URL = `http://localhost:${PORT}/api/auth`;

async function testPhase2() {
  console.log('--- Aether Phase 2 End-to-End API Testing ---');
  
  // Give the server a second to start via index.js
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    console.log('[1] Cleaning DB state for tests...');
    await Department.deleteMany({});
    await User.deleteMany({});

    console.log('[2] Creating mock department...');
    const dept = await Department.create({ name: 'Mathematics', code: 'MATH' });

    console.log('[3] Testing User Registration (POST /register)...');
    const registerPayload = {
      name: 'Alice Smith',
      email: 'alice.smith@aether.test',
      password: 'securepassword123',
      role: 'student',
      departmentId: dept._id.toString()
    };
    const regRes = await axios.post(`${BASE_URL}/register`, registerPayload);
    console.log(`✅ Registration Successful! Received Token: ${regRes.data.data.accessToken.substring(0, 15)}...`);

    console.log('[4] Testing User Login (POST /login)...');
    const loginPayload = {
      email: 'alice.smith@aether.test',
      password: 'securepassword123'
    };
    const loginRes = await axios.post(`${BASE_URL}/login`, loginPayload);
    const token = loginRes.data.data.accessToken;
    console.log(`✅ Login Successful! User ID: ${loginRes.data.data.user._id}`);

    console.log('[5] Testing Protected Route (GET /me)...');
    const meRes = await axios.get(`${BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Protected Route Accessed! Hello, ${meRes.data.data.name} from ${meRes.data.data.departmentId.name}`);

    console.log('\n✅✅ All Phase 2 Core API tests passed successfully!');

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

testPhase2();
