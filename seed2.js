/**
 * AETHER — Full Database Seed Script v2
 * - Real SPIT faculty, HODs, Deans from official directory
 * - Real Student Council 2025-26
 * - 300 mock students (100 per dept, div A & B)
 * - Subject catalogue per department (semester 3)
 * - Full 6-day timetable per dept/division
 *
 * Run: node seed.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './src/utils/db.js';
import { Department, User, Subject, Room, Timetable } from './src/shared.js';

const DEFAULT_PASSWORD = await bcrypt.hash('Aether@2026', 10); // ⚠️ HARDCODED default

// ─── Departments ─────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  { name: 'Computer Engineering',            code: 'COMPS', color: '#3b82f6' },
  { name: 'Computer Science & Engineering',  code: 'CSE',   color: '#8b5cf6' },
  { name: 'Electronics & Telecommunication', code: 'EXTC',  color: '#10b981' },
];

// ─── Faculty by Department ────────────────────────────────────────────────────
const FACULTY_BY_DEPT = {
  COMPS: {
    hod: { name: 'Dr. Surekha Dholay', email: 'surekha_dholay@spit.ac.in' },
    faculty: [
      { name: 'Shri. Pramod Bide',      email: 'pramod_bide@spit.ac.in' },
      { name: 'Dr. K.K. Devadkar',      email: 'kailas_devadkar@spit.ac.in' },
      { name: 'Smt. Kiran Gawande',     email: 'kiran_gawande@spit.ac.in' },
      { name: 'Shri. Sunil Ghane',      email: 'sunil_ghane@spit.ac.in' },
      { name: 'Shri. Anand Godbole',    email: 'anand_godbole@spit.ac.in' },
      { name: 'Smt. Reeta Koshy',       email: 'reeta_koshy@spit.ac.in' },
      { name: 'Smt. Swapnali Kurhade',  email: 'swapnali.kurhade@spit.ac.in' },
      { name: 'Dr. Anant Nimkar',       email: 'anant_nimkar@spit.ac.in' },
      { name: 'Smt. Jyoti Ramteke',     email: 'jyoti_ramteke@spit.ac.in' },
      { name: 'Dr. Nataasha Raul',      email: 'nataasharaul@spit.ac.in' },
      { name: 'Dr. Disha Sail',         email: 'rupali_sawant@spit.ac.in' },
      { name: 'Shri. Abhijeet Salunke', email: 'abhijeet_salunke@spit.ac.in' },
      { name: 'Shri. Jignesh Sisodia',  email: 'jsisodia@spit.ac.in' },
    ]
  },
  CSE: {
    hod: { name: 'Dr. Sujata Kulkarni', email: 'sujata_kulkarni@spit.ac.in' },
    faculty: [
      { name: 'Shri. D.D. Ambawade',     email: 'dd_ambawade@spit.ac.in' },
      { name: 'Smt. Sheetal Chaudhari',  email: 'sheetal_chaudhari@spit.ac.in' },
      { name: 'Smt. Aparna Halbe',       email: 'aparna_halbe@spit.ac.in' },
      { name: 'Smt. Varsha Hole',        email: 'varsha_hole@spit.ac.in' },
      { name: 'Smt. Nikahat Kazi',       email: 'nikahat_kazi@spit.ac.in' },
      { name: 'Smt. Renuka Pawar',       email: 'renuka_pawar@spit.ac.in' },
      { name: 'Shri. Harshil Kanakia',   email: 'harshil_kanakia@spit.ac.in' },
      { name: 'Dr. Aarti Karande',       email: 'aartimkarande@spit.ac.in' },
      { name: 'Smt. Nikhita Mangaonkar',email: 'nikhita.mangaonkar@spit.ac.in' },
      { name: 'Smt. Sakina Salmani',     email: 'sakina_shaikh@spit.ac.in' },
      { name: 'Smt. Pallavi Thakur',     email: 'pallavi.thakur@spit.ac.in' },
    ]
  },
  EXTC: {
    hod: { name: 'Dr. R.G. Sutar', email: 'rajendra_sutar@spit.ac.in' },
    faculty: [
      { name: 'Smt. Manisha Bansode',  email: 'manisha_bansode@spit.ac.in' },
      { name: 'Dr. N.A. Bhagat',       email: 'narendra_bhagat@spit.ac.in' },
      { name: 'Dr. Amol Deshpande',    email: 'amol_deshpande@spit.ac.in' },
      { name: 'Smt. Priya Deshpande',  email: 'Priya.chimurkar@spit.ac.in' },
      { name: 'Shri. Najib Ghatte',    email: 'najib_ghatte@spit.ac.in' },
      { name: 'Shri. Govind Haldankar',email: 'g_haldankar@spit.ac.in' },
      { name: 'Dr. D.C Karia',         email: 'deepak_karia@spit.ac.in' },
      { name: 'Dr. P.V. Kasambe',      email: 'prashant_kasambe@spit.ac.in' },
      { name: 'Dr. Anand Mane',        email: 'anand_mane@spit.ac.in' },
      { name: 'Smt. Pallavi Nair',     email: 'pallavi_malame@spit.ac.in' },
      { name: 'Shri. Milind Paraye',   email: 'milind_paraye@spit.ac.in' },
      { name: 'Shri. Manish Parmar',   email: 'manish_parmar@spit.ac.in' },
      { name: 'Prof. Rajendra Sawant', email: 'rajendra.sawant@spit.ac.in' },
      { name: 'Smt. Payal Shah',       email: 'payal_shah@spit.ac.in' },
      { name: 'Dr. Sukanya Kulkarni',  email: 'sukanya_kulkarni@spit.ac.in' },
      { name: 'Smt. Sneha Weakey',     email: 'sneha_15weakey@spit.ac.in' },
    ]
  }
};

// ─── Deans ────────────────────────────────────────────────────────────────────
const DEANS = [
  { name: 'Prof. Sudhir Dhage', email: 'sudhir_dhage@spit.ac.in', subRole: 'dean_admin' },
  { name: 'Prof. Y S Rao',      email: 'ysrao@spit.ac.in',         subRole: 'dean_academics' },
  { name: 'Dr. Kiran Talele',   email: 'kiran.talele@spit.ac.in',  subRole: 'dean_students' },
];

// ─── Student Council ──────────────────────────────────────────────────────────
const COUNCIL_MEMBERS = [
  { name: 'Aparna Jha',                email: 'aparna.jha@student.spit.ac.in',           subRole: 'general_secretary',     dept: 'EXTC' },
  { name: 'Yash Thakkar',              email: 'yash.thakkar@student.spit.ac.in',          subRole: 'finance_secretary',     dept: 'COMPS' },
  { name: 'Harshavardhan Singh Deora', email: 'harshavardhan.deora@student.spit.ac.in',  subRole: 'sports_secretary',      dept: 'CSE' },
  { name: 'Ved Thakkar',               email: 'ved.thakkar@student.spit.ac.in',           subRole: 'technical_secretary',   dept: 'COMPS' },
  { name: 'Shantanu Borhade',          email: 'shantanu.borhade@student.spit.ac.in',      subRole: 'cultural_secretary',    dept: 'CSE' },
  { name: 'Mansi Khatri',              email: 'mansi.khatri@student.spit.ac.in',          subRole: 'cultural_secretary',    dept: 'EXTC' },
  { name: 'Saniya Mangale',            email: 'saniya.mangale@student.spit.ac.in',        subRole: 'ladies_representative', dept: 'EXTC' },
  { name: 'Miheera Nikam',             email: 'miheera.nikam@student.spit.ac.in',         subRole: 'ladies_representative', dept: 'CSE' },
  { name: 'Vibhuti Wagh',              email: 'vibhuti.wagh@student.spit.ac.in',          subRole: 'vice_finance_secretary',dept: 'EXTC' },
  { name: 'Anshh Amin',                email: 'anshh.amin@student.spit.ac.in',            subRole: 'vice_sports_secretary', dept: 'COMPS' },
  { name: 'Dheer Kedia',               email: 'dheer.kedia@student.spit.ac.in',           subRole: 'vice_technical_secretary',dept:'COMPS'},
  { name: 'Soham Joshi',               email: 'soham.joshi@student.spit.ac.in',           subRole: 'vice_cultural_secretary',dept: 'EXTC' },
  { name: 'Aarushi Sawant',            email: 'aarushi.sawant@student.spit.ac.in',        subRole: 'vice_cultural_secretary',dept: 'EXTC' },
  { name: 'Tanushree Kochade',         email: 'tanushree.kochade@student.spit.ac.in',     subRole: 'vice_cultural_secretary',dept: 'COMPS'},
  { name: 'Sanika Nilesh Mahale',      email: 'sanika.mahale@student.spit.ac.in',         subRole: 'social_media_manager',  dept: 'CSE' },
  { name: 'Naafe Khan',                email: 'naafe.khan@student.spit.ac.in',            subRole: 'social_media_manager',  dept: 'EXTC' },
  { name: 'Sphurti Asawa',             email: 'sphurti.asawa@student.spit.ac.in',         subRole: 'general_secretary',     dept: 'EXTC' },
];

// ─── Committees ───────────────────────────────────────────────────────────────
const COMMITTEES = [
  { prefix: 'ecell', dept: 'EXTC' },
  { prefix: 'csi', dept: 'COMPS' },
  { prefix: 'cspit', dept: 'CSE' },
  { prefix: 'sports', dept: 'EXTC' },
  { prefix: 'oculus', dept: 'COMPS' }
];

// ─── Subjects per Department (Semester 3) ─────────────────────────────────────
// ⚠️ HARDCODED subjects — update with real university syllabus codes/credits
const SUBJECTS = {
  COMPS: [
    { name: 'Data Structures',          code: 'COMPS301', credits: 4, semester: 3 },
    { name: 'Object Oriented Programming', code: 'COMPS302', credits: 4, semester: 3 },
    { name: 'Digital Logic Design',     code: 'COMPS303', credits: 3, semester: 3 },
    { name: 'Discrete Mathematics',     code: 'COMPS304', credits: 3, semester: 3 },
    { name: 'Computer Organisation',    code: 'COMPS305', credits: 3, semester: 3 },
  ],
  CSE: [
    { name: 'Machine Learning Fundamentals', code: 'CSE301', credits: 4, semester: 3 },
    { name: 'Database Management Systems',   code: 'CSE302', credits: 4, semester: 3 },
    { name: 'Operating Systems',             code: 'CSE303', credits: 3, semester: 3 },
    { name: 'Computer Networks',             code: 'CSE304', credits: 3, semester: 3 },
    { name: 'Statistics for Data Science',   code: 'CSE305', credits: 3, semester: 3 },
  ],
  EXTC: [
    { name: 'Digital Electronics',           code: 'EXTC301', credits: 4, semester: 3 },
    { name: 'Analog Communication',          code: 'EXTC302', credits: 4, semester: 3 },
    { name: 'Signals & Systems',             code: 'EXTC303', credits: 3, semester: 3 },
    { name: 'Electromagnetic Engineering',   code: 'EXTC304', credits: 3, semester: 3 },
    { name: 'Electronic Devices & Circuits', code: 'EXTC305', credits: 3, semester: 3 },
  ],
};

// ─── Rooms ────────────────────────────────────────────────────────────────────
// ⚠️ HARDCODED room GPS — update with real room-level coordinates
const ROOMS = [
  { name: 'CR-101', building: 'Main',   floor: 1, capacity: 60,  floorPlanCoordinates: { x: 19.1249, y: 72.8464 } },
  { name: 'CR-102', building: 'Main',   floor: 1, capacity: 60,  floorPlanCoordinates: { x: 19.1249, y: 72.8464 } },
  { name: 'CR-201', building: 'Main',   floor: 2, capacity: 60,  floorPlanCoordinates: { x: 19.1249, y: 72.8464 } },
  { name: 'CR-202', building: 'Main',   floor: 2, capacity: 60,  floorPlanCoordinates: { x: 19.1249, y: 72.8464 } },
  { name: 'CR-301', building: 'Main',   floor: 3, capacity: 60,  floorPlanCoordinates: { x: 19.1249, y: 72.8464 } },
  { name: 'CR-302', building: 'Main',   floor: 3, capacity: 60,  floorPlanCoordinates: { x: 19.1249, y: 72.8464 } },
  { name: 'Lab-101',building: 'Lab',    floor: 1, capacity: 30,  floorPlanCoordinates: { x: 19.1249, y: 72.8464 } },
  { name: 'Lab-201',building: 'Lab',    floor: 2, capacity: 30,  floorPlanCoordinates: { x: 19.1249, y: 72.8464 } },
  { name: 'Lab-301',building: 'Lab',    floor: 3, capacity: 30,  floorPlanCoordinates: { x: 19.1249, y: 72.8464 } },
  { name: 'Seminar Hall', building: 'Main', floor: 0, capacity: 120, floorPlanCoordinates: { x: 19.1249, y: 72.8464 } },
  { name: 'Auditorium',   building: 'Main', floor: 0, capacity: 500, floorPlanCoordinates: { x: 19.1249, y: 72.8464 } },
];

// ─── Student Name Pool ────────────────────────────────────────────────────────
// ⚠️ HARDCODED mock names — replace with real admission data from university
const FIRST_NAMES = [
  'Aarav','Aditi','Akash','Anika','Ankit','Ananya','Arjun','Avni','Ayush','Bhavna',
  'Chirag','Deepika','Dev','Divya','Gaurav','Garima','Harsh','Hetal','Ishan','Ishita',
  'Jay','Juhi','Karan','Kavya','Kunal','Komal','Lakshmi','Manav','Meera','Mihir',
  'Neel','Neha','Nikhil','Nisha','Om','Pallavi','Parth','Pooja','Pranav','Priya',
  'Raj','Riya','Rohan','Ruchi','Sahil','Sakshi','Sarthak','Shreya','Shubham','Sneha',
  'Soham','Sonali','Sumit','Sunita','Tanvi','Tejas','Uday','Uma','Varun','Vidya',
  'Vihan','Vinita','Vivek','Yash','Yashvi','Zara','Zaid','Asha','Bhushan','Chetan',
  'Dhruv','Disha','Esha','Farhan','Gauri','Hitesh','Isha','Jatin','Ketki','Lalit',
  'Madhuri','Mahesh','Nalini','Nilesh','Omkar','Payal','Pushkar','Rachna','Rushil','Samir',
  'Tanya','Tushar','Urmila','Vedant','Waqar','Xenon','Yamini','Zayn','Abhi','Bhumi',
];
const LAST_NAMES = [
  'Sharma','Patil','Shah','Mehta','Joshi','Verma','Singh','Gupta','Kumar','Patel',
  'Nair','Rao','Iyer','Desai','Bhat','Mishra','Tiwari','Pandey','Dubey','Sinha',
  'Chopra','Kapoor','Malhotra','Arora','Bose','Das','Ghosh','Sen','Mukherjee','Chatterjee',
  'Pillai','Menon','Thomas','Abraham','George','Philip','Joseph','Samuel','John','Paul',
];

function randomName(i, code) {
  const first = FIRST_NAMES[i % FIRST_NAMES.length];
  const last = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
  return { name: `${first} ${last}`, email: `${code.toLowerCase()}.${i + 1}@student.spit.ac.in` };
}

// ─── Timetable Template ───────────────────────────────────────────────────────
// Mon-Sat, 4 lectures/day, 1 hr each. Each subject appears twice a week.
// ⚠️ HARDCODED schedule pattern — update with real university schedule
const SLOT_TIMES = [
  { startTime: '09:00', endTime: '10:00' },
  { startTime: '10:00', endTime: '11:00' },
  { startTime: '11:15', endTime: '12:15' },
  { startTime: '14:00', endTime: '15:00' },
];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function buildTimetableSlots(subjects, facultyIds, roomId) {
  const slots = [];
  let subIdx = 0;
  for (let d = 0; d < DAYS.length; d++) {
    for (let t = 0; t < SLOT_TIMES.length; t++) {
      const sub = subjects[subIdx % subjects.length];
      const fac = facultyIds[subIdx % facultyIds.length];
      slots.push({
        day: DAYS[d],
        startTime: SLOT_TIMES[t].startTime,
        endTime: SLOT_TIMES[t].endTime,
        subjectId: sub,
        facultyId: fac,
        roomId,
      });
      subIdx++;
    }
  }
  return slots;
}

// ─── Seed Runner ──────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Aether Database Seed v2 — S.P.I.T. Production Data');
  await connectDB(process.env.MONGODB_URI);

  console.log('🧹 Clearing existing data...');
  await Promise.all([
    Department.deleteMany({}),
    User.deleteMany({}),
    Subject.deleteMany({}),
    Room.deleteMany({}),
    Timetable.deleteMany({}),
  ]);

  // 1. Departments
  console.log('📚 Seeding Departments...');
  const deptDocs = {};
  for (const d of DEPARTMENTS) deptDocs[d.code] = await Department.create(d);

  // 2. Rooms
  console.log('🏫 Seeding Rooms...');
  const roomDocs = [];
  for (const r of ROOMS) roomDocs.push(await Room.create(r));
  const roomMap = Object.fromEntries(roomDocs.map(r => [r.name, r]));

  // 3. Deans
  console.log('🎓 Seeding Deans...');
  for (const dean of DEANS) {
    await User.create({ name: dean.name, email: dean.email, passwordHash: DEFAULT_PASSWORD, role: 'dean', subRole: dean.subRole, departmentId: deptDocs['COMPS']._id });
  }

  // 4. HODs + Faculty + Subjects + Timetable per department
  for (const [code, data] of Object.entries(FACULTY_BY_DEPT)) {
    const dept = deptDocs[code];
    console.log(`\n👨‍🏫 Seeding ${code}...`);

    // HOD
    await User.create({ name: data.hod.name, email: data.hod.email, passwordHash: DEFAULT_PASSWORD, role: 'hod', departmentId: dept._id });

    // Faculty — first one gets timetable_coord
    const facultyDocs = [];
    for (let i = 0; i < data.faculty.length; i++) {
      const f = data.faculty[i];
      const doc = await User.create({
        name: f.name, email: f.email, passwordHash: DEFAULT_PASSWORD,
        role: 'faculty', departmentId: dept._id,
        subRole: i === 0 ? 'timetable_coord' : null,  // ⚠️ First faculty = timetable coordinator
      });
      facultyDocs.push(doc);
    }
    console.log(`  ✓ ${data.faculty.length} faculty seeded (${data.faculty[0].name} is timetable_coord)`);

    // Subjects
    const subjectDocs = [];
    for (const s of SUBJECTS[code]) {
      const doc = await Subject.create({ ...s, departmentId: dept._id });
      subjectDocs.push(doc);
    }
    console.log(`  ✓ ${subjectDocs.length} subjects seeded`);

    // Timetable for each division (A & B) — uses different rooms
    const rooms = [roomMap['CR-101'], roomMap['CR-102'], roomMap['CR-201']];
    for (let divIdx = 0; divIdx < 2; divIdx++) {
      const division = divIdx === 0 ? 'A' : 'B';
      const room = rooms[divIdx % rooms.length];
      const slots = buildTimetableSlots(
        subjectDocs.map(s => s._id),
        facultyDocs.map(f => f._id),
        room._id
      );
      await Timetable.create({
        departmentId: dept._id,
        division,
        semester: 3,
        academicYear: '2026-2027',
        uploadedBy: facultyDocs[0]._id,
        status: 'approved',  // ⚠️ Auto-approved for seed — normally needs HOD review
        slots,
      });
      console.log(`  ✓ Timetable for ${code} Div-${division} seeded (${slots.length} slots across Mon-Sat)`);
    }

    // 5. Students — 100 per dept, 50 per division
    const students = [];
    for (let i = 0; i < 100; i++) {
      const { name, email } = randomName(i, code);
      const div = i < 50 ? 'A' : 'B';
      students.push({ name, email, passwordHash: DEFAULT_PASSWORD, role: 'student', departmentId: dept._id, division: div, enrollmentNo: `${code}${2024}${String(i + 1).padStart(3, '0')}` });
    }
    await User.insertMany(students);
    console.log(`  ✓ 100 students seeded (50 div-A, 50 div-B)`);
  }

  // 6. Council
  console.log('\n🏛️ Seeding Student Council 2025-26...');
  for (const c of COUNCIL_MEMBERS) {
    await User.create({ name: c.name, email: c.email, passwordHash: DEFAULT_PASSWORD, role: 'council', subRole: c.subRole, departmentId: deptDocs[c.dept]._id });
  }

  // 7. Committees
  console.log('\n🏛️ Seeding Committees...');
  for (const c of COMMITTEES) {
    for (let i = 0; i < 5; i++) {
      const isHead = i === 0;
      const subRole = isHead ? `${c.prefix}_head` : `${c.prefix}_vice`;
      const name = `${c.prefix.toUpperCase()} ${isHead ? 'Chairperson' : `Vice-Chairperson ${i}`}`;
      const email = `${c.prefix}${isHead ? 'head' : `vice${i}`}@student.spit.ac.in`;
      
      await User.create({ 
        name, 
        email, 
        passwordHash: DEFAULT_PASSWORD, 
        role: 'student', 
        subRole, 
        departmentId: deptDocs[c.dept]._id 
      });
    }
  }

  // 7. Super Admin
  console.log('\n👑 Seeding Super Admin...');
  await User.create({
    name: 'Super Admin',
    email: 'admin@spit.ac.in',
    passwordHash: DEFAULT_PASSWORD,
    role: 'superadmin',
    departmentId: deptDocs['COMPS']._id // Needs a dept so it doesn't fail schema
  });

  // Summary
  const counts = {
    departments: await Department.countDocuments(),
    users: await User.countDocuments(),
    hods: await User.countDocuments({ role: 'hod' }),
    faculty: await User.countDocuments({ role: 'faculty' }),
    deans: await User.countDocuments({ role: 'dean' }),
    council: await User.countDocuments({ role: 'council' }),
    students: await User.countDocuments({ role: 'student' }),
    subjects: await Subject.countDocuments(),
    timetables: await Timetable.countDocuments(),
    rooms: await Room.countDocuments(),
    superadmins: await User.countDocuments({ role: 'superadmin' }),
    council: await User.countDocuments({ role: 'council' }),
  };

  console.log('\n✅ Seed Complete!');
  console.log('─'.repeat(42));
  console.log(`  Departments : ${counts.departments}`);
  console.log(`  Rooms       : ${counts.rooms}`);
  console.log(`  Subjects    : ${counts.subjects}`);
  console.log(`  Timetables  : ${counts.timetables} (6 total, Mon–Sat × 2 divs × 3 depts)`);
  console.log(`  Total Users : ${counts.users}`);
  console.log(`    Deans     : ${counts.deans}
    SuperAdmins: ${counts.superadmins}
    HODs      : ${counts.hods}
    Faculty   : ${counts.faculty}
    Council   : ${counts.council}
    Students  : ${counts.students} (Includes 25 committee members)`);
  console.log('─'.repeat(42));
  console.log('\n🔑 Default Password for ALL accounts: Aether@2026');
  console.log('⚠️  HARDCODED items to replace before production:');
  console.log('   - Student names/emails (mock, not real admission data)');
  console.log('   - Room GPS coordinates (approximate SPIT campus)');
  console.log('   - Timetable schedule pattern (needs real university schedule)');
  console.log('   - Subject codes/credits (verify against university syllabus)\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(e => { console.error('❌ Seed failed:', e.message); process.exit(1); });
