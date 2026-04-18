import 'dotenv/config';
import mongoose from 'mongoose';
import { User, Department, connectDB } from './src/shared.js';

async function testPhase1() {
  console.log('--- Aether Phase 1 Manual Testing ---');

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aether_phase1_test';
  console.log(`Connecting to database at ${uri}...`);
  await connectDB(uri);

  try {
    // Clean up
    await Department.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared previous test data.');

    // Create a department
    const dept = await Department.create({
      name: 'Computer Science',
      code: 'CS',
      color: '#ff0000'
    });
    console.log(`Created Department: ${dept.name} (${dept.code})`);

    // Create a user
    const user = await User.create({
      name: 'John Doe',
      email: 'john.doe@aether.test',
      passwordHash: 'hashedpassword_test',
      role: 'student',
      departmentId: dept._id
    });
    console.log(`Created User: ${user.name} with Role: ${user.role} linked to Dept: ${dept.code}`);

    console.log('\n✅ Phase 1 Test Successful!');
    console.log('Models, Utilities, and Connections are working as expected.');
    
  } catch (err) {
    console.error('❌ Phase 1 Test Failed:', err);
  } finally {
    process.exit(0);
  }
}

testPhase1();
