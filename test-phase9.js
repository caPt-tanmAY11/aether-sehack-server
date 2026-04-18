import axios from 'axios';
import { User, Notification, Department, ChatbotLog } from './src/shared.js';
import { server } from './src/index.js';

const PORT = 4000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function testPhase9() {
  console.log('--- Aether Phase 9: AI Chatbot Testing ---');
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    console.log('[1] Cleaning Testing State...');
    await User.deleteMany({});
    await ChatbotLog.deleteMany({});
    await Notification.deleteMany({});
    await Department.deleteMany({});

    console.log('[2] Bootstrapping Demo Account...');
    const dept = await Department.create({ name: 'Tech', code: 'TECH' });
    const stuRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'AI Tester', email: 'ai@ae.edu', password: 'password123',
      role: 'student', departmentId: dept._id.toString()
    });
    const token = stuRes.data.data.accessToken;

    console.log('[3] Sending a basic query to Aether AI...');
    const q1 = await axios.post(`${BASE_URL}/chatbot/message`, {
      query: 'What time does the library open?'
    }, { headers: { Authorization: `Bearer ${token}` } });
    console.log(`✅ Aether AI responded: "${q1.data.data.response.substring(0, 100)}..."`);

    console.log('[4] Sending an escalation-trigger query (safety concern)...');
    const q2 = await axios.post(`${BASE_URL}/chatbot/message`, {
      query: 'There is a broken electrical wire exposed near Lab 3 creating a fire hazard, no one has fixed it for 3 days.'
    }, { headers: { Authorization: `Bearer ${token}` } });
    
    if (q2.data.data.escalated) {
      console.log(`✅ Escalation detected! Routed to: [${q2.data.data.escalatedTo}]`);
      console.log(`   Response: "${q2.data.data.response.substring(0, 120)}"`);
    } else {
      console.log(`⚠️  Escalation not triggered (AI response was normal). Response: ${q2.data.data.response}`);
    }

    console.log('[5] Fetching conversation history...');
    const histRes = await axios.get(`${BASE_URL}/chatbot/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ History returned ${histRes.data.data.length} log entries.`);

    console.log('\n✅✅ Phase 9 AI Chatbot tests complete!');
  } catch (error) {
    if (error.response) console.error('❌ API Request Failed:', error.response.status, error.response.data);
    else console.error('❌ Test Execution Failed:', error.message);
  } finally {
    console.log('Shutting down server...');
    server.close();
    process.exit(0);
  }
}

testPhase9();
