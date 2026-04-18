import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './src/utils/db.js';
import { User, SyllabusProgress, Timetable, Room, Attendance, Club, EventRequest, Department } from './src/shared.js';
import bcrypt from 'bcryptjs';

async function sync() {
  console.log('🔄 Starting Aether Database Sync & Perfection Script...');
  await connectDB(process.env.MONGODB_URI);

  // 1. Valid Semester for all Students
  console.log('📚 Setting valid semester for all students...');
  const result = await User.updateMany({ role: 'student', $or: [{ semester: { $exists: false } }, { semester: null }] }, { $set: { semester: 3 } });
  console.log(`  ✓ Updated ${result.modifiedCount} students to Semester 3`);

  // 2. Adjusting Rooms for Vacant Room precision
  console.log('🏫 Adjusting Rooms so majority are occupied...');
  // We have 6 divisions (COMPS A/B, CSE A/B, EXTC A/B). If we want only a few empty, 
  // let's ensure we only have 8 total lecture rooms (6 occupied, 2 vacant).
  // We will remove all rooms and recreate exactly 8 rooms.
  await Room.deleteMany({});
  const roomsToSeed = [
    { name: 'CR-101', building: 'Main', floor: 1, capacity: 60, floorPlanCoordinates: { x: 19.1249, y: 72.8464 } },
    { name: 'CR-102', building: 'Main', floor: 1, capacity: 60, floorPlanCoordinates: { x: 19.1249, y: 72.8464 } },
    { name: 'CR-201', building: 'Main', floor: 2, capacity: 60, floorPlanCoordinates: { x: 19.1249, y: 72.8464 } },
    { name: 'CR-202', building: 'Main', floor: 2, capacity: 60, floorPlanCoordinates: { x: 19.1249, y: 72.8464 } },
    { name: 'CR-301', building: 'Main', floor: 3, capacity: 60, floorPlanCoordinates: { x: 19.1249, y: 72.8464 } },
    { name: 'CR-302', building: 'Main', floor: 3, capacity: 60, floorPlanCoordinates: { x: 19.1249, y: 72.8464 } },
    { name: 'CR-401', building: 'Main', floor: 4, capacity: 60, floorPlanCoordinates: { x: 19.1249, y: 72.8464 } },
    { name: 'CR-402', building: 'Main', floor: 4, capacity: 60, floorPlanCoordinates: { x: 19.1249, y: 72.8464 } }, // 8 rooms total
  ];
  const roomDocs = await Room.insertMany(roomsToSeed);
  console.log(`  ✓ Inserted 8 strictly controlled rooms`);

  // 3. Re-assigning timetable rooms to these 8 rooms
  console.log('📅 Aligning Timetable to new rooms...');
  const timetables = await Timetable.find({});
  let ttIndex = 0;
  for (const tt of timetables) {
    const room = roomDocs[ttIndex % 6]; // Uses first 6 rooms, leaving 2 strictly vacant
    for (const slot of tt.slots) {
      slot.roomId = room._id;
    }
    await tt.save();
    ttIndex++;
  }
  console.log(`  ✓ Timetables aligned. 6 rooms consistently occupied, 2 vacant.`);

  // 4. Initializing Syllabus
  console.log('📖 Initializing Syllabus Progress trackers...');
  let syllabusCount = 0;
  for (const tt of timetables) {
    for (const slot of tt.slots) {
      const exists = await SyllabusProgress.findOne({
        facultyId: slot.facultyId,
        subjectId: slot.subjectId,
        academicYear: tt.academicYear
      });

      if (!exists) {
        await SyllabusProgress.create({
          facultyId: slot.facultyId,
          subjectId: slot.subjectId,
          departmentId: tt.departmentId,
          semester: tt.semester,
          academicYear: tt.academicYear,
          topics: [
            { name: 'Introduction Module', status: 'pending' },
            { name: 'Core Concepts', status: 'pending' }
          ],
        });
        syllabusCount++;
      }
    }
  }
  console.log(`  ✓ Created ${syllabusCount} missing Syllabus trackers`);

  // 5. Mocking Attendance
  console.log('✅ Synchronizing Attendance Records...');
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const now = new Date();
  const currentDay = now.getDay();
  
  for (const tt of timetables) {
    const students = await User.find({ role: 'student', departmentId: tt.departmentId, division: tt.division });
    if (students.length === 0) continue;

    for (const slot of tt.slots) {
      const targetDay = DAYS.indexOf(slot.day);
      const distance = targetDay - currentDay;
      const slotDate = new Date(now);
      slotDate.setDate(now.getDate() + distance);
      slotDate.setHours(0, 0, 0, 0);

      const existingAtt = await Attendance.findOne({ date: slotDate, subjectId: slot.subjectId, division: tt.division });
      if (!existingAtt) {
        // Create mock records for all students in this division
        const records = students.map(st => ({
          studentId: st._id,
          status: Math.random() > 0.2 ? 'present' : 'absent' // 80% present
        }));

        await Attendance.create({
          timetableSlotRef: { timetableId: tt._id, day: slot.day, startTime: slot.startTime },
          subjectId: slot.subjectId,
          facultyId: slot.facultyId,
          departmentId: tt.departmentId,
          division: tt.division,
          date: slotDate,
          records
        });
      }
    }
  }
  console.log(`  ✓ Created full week sample attendance for all divisions`);

  // 6. Creating Committees
  console.log('🏛 Creating Committees and Club Accounts...');
  const dept = await Department.findOne();
  if (dept) {
    const committees = [
      { name: 'CSI', email: 'csi@spit.ac.in', pass: 'Csi', cat: 'technical' },
      { name: 'E-Cell', email: 'ecell@spit.ac.in', pass: 'E cell', cat: 'entrepreneurship' },
      { name: 'RC', email: 'rc@spit.ac.in', pass: 'RC', cat: 'social' },
      { name: 'Sports', email: 'sports@spit.ac.in', pass: 'Sports', cat: 'sports' },
      { name: 'Oculus', email: 'oculus@spit.ac.in', pass: 'Oculus', cat: 'cultural' }
    ];

    const allStudents = await User.find({ role: 'student' }).limit(20);
    const faculty = await User.findOne({ role: 'faculty' });

    for (const c of committees) {
      let comUser = await User.findOne({ email: c.email });
      if (!comUser) {
        const hash = await bcrypt.hash(c.pass, 10);
        comUser = await User.create({
          name: c.name,
          email: c.email,
          passwordHash: hash,
          role: 'committee',
          departmentId: dept._id
        });
      }

      let club = await Club.findOne({ name: c.name });
      if (!club && faculty && allStudents.length >= 2) {
        const pres = allStudents[0];
        const vp = allStudents[1];
        
        club = await Club.create({
          name: c.name,
          description: `Official ${c.name} Committee`,
          category: c.cat,
          facultyAdvisorId: faculty._id,
          departmentId: dept._id,
          members: [
            { userId: pres._id, role: 'president' },
            { userId: vp._id, role: 'vice_president' }
          ],
          joinRequests: [
            { userId: allStudents[2]?._id, message: "I want to join!", status: 'pending' },
            { userId: allStudents[3]?._id, message: "I'm very interested", status: 'pending' }
          ].filter(r => r.userId)
        });

        // Create random approved events for them
        const d1 = new Date(); d1.setDate(d1.getDate() + Math.floor(Math.random() * 5));
        const d2 = new Date(d1); d2.setHours(d2.getHours() + 2);
        
        const d3 = new Date(); d3.setDate(d3.getDate() + Math.floor(Math.random() * 5 + 5));
        const d4 = new Date(d3); d4.setHours(d4.getHours() + 2);

        await EventRequest.create({
          requestedBy: comUser._id,
          title: `${c.name} Main Event`,
          description: `Welcome to ${c.name} event`,
          venue: 'Main Auditorium',
          startTime: d1,
          endTime: d2,
          currentStage: 'approved',
          departmentId: dept._id
        });
        
        await EventRequest.create({
          requestedBy: comUser._id,
          title: `${c.name} Workshop`,
          description: `Learn new skills with ${c.name}`,
          venue: 'Room 202',
          startTime: d3,
          endTime: d4,
          currentStage: 'council', // pending
          departmentId: dept._id
        });
      }
    }
  }
  console.log(`  ✓ Committees seeded successfully`);

  console.log('─'.repeat(42));
  console.log('🚀 Sync Complete! All data perfectly aligned.');
  await mongoose.disconnect();
  process.exit(0);
}

sync().catch(e => { console.error('❌ Sync failed:', e); process.exit(1); });
