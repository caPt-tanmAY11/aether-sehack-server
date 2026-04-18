import axios from 'axios';
import { io as connectSocket } from 'socket.io-client';
import { User, Notification, Department } from './src/shared.js';
import { notificationService } from './src/notifications/notification.service.js';
import { server } from './src/index.js';

const PORT = 4000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function testPhase8() {
  console.log('--- Aether Phase 8: Notifications & Socket.io Testing ---');
  process.env.REDIS_URL = 'mock';
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    console.log('[1] Cleaning Testing State...');
    await User.deleteMany({});
    await Notification.deleteMany({});
    await Department.deleteMany({});

    console.log('[2] Bootstrapping Demo Account...');
    const dept = await Department.create({ name: 'Tech', code: 'TECH' });
    const stuRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Socket Tester', email: 'sock@ae.edu', password: 'password123',
      role: 'student', departmentId: dept._id.toString()
    });
    const token = stuRes.data.data.accessToken;
    const userId = stuRes.data.data.user._id;

    console.log('[3] Connecting Socket.io client with JWT auth...');
    const socket = connectSocket(`http://localhost:${PORT}`, {
      auth: { token },
      transports: ['websocket']
    });

    await new Promise((resolve, reject) => {
      socket.on('connect', resolve);
      socket.on('connect_error', reject);
      setTimeout(() => reject(new Error('Socket connection timed out')), 5000);
    });
    console.log('✅ Socket.io connection established!');

    console.log('[4] Listening for real-time notification event...');
    const notifPromise = new Promise((resolve) => {
      socket.on('notification:new', (data) => {
        console.log(`✅ Real-time push received! Title: "${data.title}"`);
        resolve(data);
      });
    });

    // Server-side: trigger a notification (simulating what other services do)
    await notificationService.send(userId, {
      title: 'Timetable Approved',
      body: 'Your submitted timetable for Semester 1 has been approved by the HOD.',
      type: 'timetable'
    });

    await notifPromise; // Wait for socket event to fire

    console.log('[5] Fetching all notifications via REST...');
    const allRes = await axios.get(`${BASE_URL}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
    console.log(`✅ REST fetch returned ${allRes.data.data.length} notification(s).`);

    console.log('[6] Fetching unread count...');
    const unreadRes = await axios.get(`${BASE_URL}/notifications/unread`, { headers: { Authorization: `Bearer ${token}` } });
    console.log(`✅ Unread count: ${unreadRes.data.count}`);

    console.log('[7] Marking all as read...');
    await axios.patch(`${BASE_URL}/notifications/read-all`, {}, { headers: { Authorization: `Bearer ${token}` } });
    const afterRead = await axios.get(`${BASE_URL}/notifications/unread`, { headers: { Authorization: `Bearer ${token}` } });
    if (afterRead.data.count === 0) console.log('✅ All notifications marked as read successfully!');

    socket.disconnect();
    console.log('\n✅✅ Phase 8 Notifications & Socket.io tests passed!');
  } catch (error) {
    if (error.response) console.error('❌ API Request Failed:', error.response.status, error.response.data);
    else console.error('❌ Test Execution Failed:', error.message);
  } finally {
    console.log('Shutting down server...');
    server.close();
    process.exit(0);
  }
}

testPhase8();
