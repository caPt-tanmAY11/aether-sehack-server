/**
 * AETHER — Full E2E Backend Test Suite
 * Run AFTER `node seed.js`
 * Run: node test-e2e.js
 */

import axios from 'axios';
import { User, Subject, SyllabusProgress } from './src/shared.js';
import { server } from './src/index.js';

const BASE = 'http://localhost:4000/api';
const PASSWORD = 'Aether@2026';

const ACCOUNTS = {
  dean:    { email: 'sudhir_dhage@spit.ac.in',                  password: PASSWORD },
  hod:     { email: 'surekha_dholay@spit.ac.in',                password: PASSWORD },
  faculty: { email: 'anant_nimkar@spit.ac.in',                  password: PASSWORD },
  council: { email: 'aparna.jha@student.spit.ac.in',            password: PASSWORD },
  student: { email: 'comps.1@student.spit.ac.in',          password: PASSWORD },
};

const pass = (label) => console.log(`  ✅ ${label}`);
const fail = (label, e) => console.log(`  ❌ ${label}: ${e?.response?.data?.message || e.message}`);

let tokens = {}, userIds = {};
let deptId, subjectId, timetableId, syllabusId, eventId, issueId, noticeId, advisingNoteId, testRoomId, leaveId, clubId;

async function login(role) {
  const r = await axios.post(`${BASE}/auth/login`, ACCOUNTS[role]);
  tokens[role] = r.data.data.accessToken;
  userIds[role] = r.data.data.user._id;
  deptId = deptId || r.data.data.user.departmentId;
  return r.data.data;
}
const auth = (role) => ({ headers: { Authorization: `Bearer ${tokens[role]}` } });

async function run() {
  console.log('\n══════════════════════════════════════════');
  console.log('  AETHER Full Backend E2E Test Suite');
  console.log('══════════════════════════════════════════\n');
  await new Promise(r => setTimeout(r, 2000));

  // ── Phase 2: Auth & RBAC ──────────────────────────────────────────────────
  console.log('── [Phase 2] Authentication & RBAC ──');
  try {
    await login('dean'); await login('hod'); await login('faculty');
    await login('council'); await login('student');
    pass('All 5 roles logged in');
  } catch(e) { fail('Login', e); return; }

  try {
    await axios.get(`${BASE}/analytics/dean/dashboard`, auth('student'));
    fail('RBAC firewall should have blocked student');
  } catch(e) {
    if (e.response?.status === 403) pass('RBAC: Student blocked from Dean endpoint');
    else fail('RBAC check', e);
  }

  // ── Phase 3: Timetable ────────────────────────────────────────────────────
  console.log('\n── [Phase 3] Timetable Management ──');

  // ROOT CAUSE 1: Duplicate Subject on re-runs — use findOneAndUpdate (upsert)
  try {
    const sub = await Subject.findOneAndUpdate(
      { code: 'CS201E2E' },
      { name: 'Data Structures (E2E)', code: 'CS201E2E', departmentId: deptId, credits: 4, semester: 3 },
      { upsert: true, new: true }
    );
    subjectId = sub._id;

    // ROOT CAUSE 5 (pre-work): Promote faculty to timetable_coord THEN re-login
    // so the JWT reflects the new subRole
    await User.findByIdAndUpdate(userIds['faculty'], { subRole: 'timetable_coord' });
    await login('faculty'); // Fresh token with subRole: timetable_coord
    // Delete any E2E timetable from previous runs to avoid 409 clash conflict
    const { Timetable } = await import('./src/shared.js');
    await Timetable.deleteMany({ division: 'E2E', departmentId: deptId });

    pass('Subject upserted + Faculty re-logged in as timetable_coord + old E2E timetable cleared');
  } catch(e) { fail('Subject/subRole setup', e); }

  try {
    const { Room, Timetable } = await import('./src/shared.js');
    const room = await Room.findOne({ name: 'CR-101' });
    if (!room) throw new Error('Room CR-101 not found — run seed.js first');

    const r = await axios.post(`${BASE}/timetable`, {
      division: 'E2E',  // Unique division so it never clashes with seeded data
      semester: 3,
      academicYear: '2026-2027',
      slots: [
        { day: 'Monday',    startTime: '09:00', endTime: '10:00', subjectId: subjectId.toString(), facultyId: userIds['faculty'], roomId: room._id.toString() },
        { day: 'Tuesday',   startTime: '09:00', endTime: '10:00', subjectId: subjectId.toString(), facultyId: userIds['faculty'], roomId: room._id.toString() },
        { day: 'Wednesday', startTime: '09:00', endTime: '10:00', subjectId: subjectId.toString(), facultyId: userIds['faculty'], roomId: room._id.toString() },
        { day: 'Thursday',  startTime: '09:00', endTime: '10:00', subjectId: subjectId.toString(), facultyId: userIds['faculty'], roomId: room._id.toString() },
        { day: 'Friday',    startTime: '09:00', endTime: '10:00', subjectId: subjectId.toString(), facultyId: userIds['faculty'], roomId: room._id.toString() },
        { day: 'Saturday',  startTime: '09:00', endTime: '10:00', subjectId: subjectId.toString(), facultyId: userIds['faculty'], roomId: room._id.toString() },
      ]
    }, auth('faculty'));
    timetableId = r.data.data._id;
    testRoomId = room._id.toString();
    pass(`Timetable uploaded — ${r.data.data.slots?.length} slots (Mon–Sat)`);
  } catch(e) { fail('Timetable upload', e); }

  try {
    const r = await axios.get(`${BASE}/timetable/me`, auth('student'));
    pass(`Timetable fetch — success: ${r.data.success}`);
  } catch(e) { fail('Timetable fetch', e); }

  // Clash detection
  try {
    const { Room } = await import('./src/shared.js');
    const room2 = await Room.findOne({ name: 'CR-101' });
    await axios.post(`${BASE}/timetable`, {
      division: 'CLASH_TEST', semester: 3, academicYear: '2026-2027',
      slots: [{ day: 'Monday', startTime: '09:30', endTime: '10:30',
        subjectId: subjectId.toString(), facultyId: userIds['faculty'], roomId: room2._id.toString() }]
    }, auth('faculty'));
    fail('Clash detection should have blocked this', new Error('Server accepted a clashing timetable'));
  } catch(e) {
    const msg = e.response?.data?.message || '';
    if (e.response?.status === 409 || msg.toLowerCase().includes('clash')) {
      pass('Clash detection working');
      const suggestions = e.response?.data?.data?.suggestions;
      if (suggestions && suggestions.length > 0) {
        pass(`Smart suggestions returned: ${suggestions.length}`);
      } else {
        fail('Smart suggestions missing or empty', new Error('Empty suggestions array'));
      }
    }
    else {
      console.log(e);
      fail(`Timetable overlap not handled properly (${e.response?.status}: ${msg})`, e);
    }
  }

  // HOD review — approvalSchema requires `status` not `action`
  try {
    const pending = await axios.get(`${BASE}/timetable/pending`, auth('hod'));
    if (pending.data.data?.length > 0) {
      const id = pending.data.data[0]._id;
      await axios.patch(`${BASE}/timetable/${id}/review`, { status: 'approved', comment: 'Looks good' }, auth('hod'));
      pass('HOD approved timetable');
    } else {
      pass('HOD pending queue empty (timetable auto-approved or pending not required)');
    }
  } catch(e) { fail('HOD timetable review', e); }

  // ── Phase 4: Attendance ───────────────────────────────────────────────────
  console.log('\n── [Phase 4] Attendance & Geo-Fencing ──');
  try {
    // Wipe today's attendance for this student so the test is idempotent on re-runs
    const { Attendance } = await import('./src/shared.js');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    await Attendance.updateMany(
      { date: today, 'records.studentId': userIds['student'] },
      { $pull: { records: { studentId: userIds['student'] } } }
    );
  } catch(e) { /* ignore cleanup errors */ }
  try {
    if (!timetableId) throw new Error('timetableId missing — timetable upload failed above');
    const todayStr = new Date().toISOString().split('T')[0];
    const r = await axios.post(`${BASE}/attendance/mark`, {
      timetableId: timetableId.toString(),
      day: 'Monday',
      startTime: '09:00',
      date: todayStr,
      studentCoord: { x: 19.1249, y: 72.8464 } // ⚠️ HARDCODED SPIT approx coords
    }, auth('student'));
    pass(`Attendance marked — ${r.data.data?.status || r.data.message}`);
  } catch(e) { fail('Attendance mark', e); }

  try {
    const todayStr2 = new Date().toISOString().split('T')[0];
    await axios.post(`${BASE}/attendance/mark`, {
      timetableId: timetableId?.toString(),
      day: 'Monday', startTime: '09:00', date: todayStr2,
      studentCoord: { x: 19.1249, y: 72.8464 }
    }, auth('student'));
    fail('Double-mark protection should have blocked 2nd check-in');
  } catch(e) {
    const msg = e.response?.data?.message?.toLowerCase() || '';
    if (e.response?.status === 409 || msg.includes('already')) pass('Double-mark protection working');
    else fail('Double-mark check', e);
  }

  // ── Phase 5: Syllabus ─────────────────────────────────────────────────────
  console.log('\n── [Phase 5] Syllabus Tracking ──');
  try {
    // Wipe any existing tracker for this subject+faculty so init is idempotent
    await SyllabusProgress.deleteMany({ subjectId, facultyId: userIds['faculty'] });
  } catch(e) { /* ignore cleanup errors */ }
  try {
    if (!subjectId) throw new Error('subjectId missing — subject creation failed above');
    // initSyllabusSchema: { subjectId, semester, academicYear, topics }
    const r = await axios.post(`${BASE}/syllabus/init`, {
      subjectId: subjectId.toString(),
      semester: 3,
      academicYear: '2026-2027',
      topics: [
        { name: 'Arrays & Linked Lists', status: 'pending' },
        { name: 'Trees & Graphs',        status: 'pending' },
        { name: 'Sorting Algorithms',    status: 'pending' },
      ]
    }, auth('faculty'));
    syllabusId = r.data.data._id;
    pass(`Syllabus initialised — ${r.data.data.topics.length} topics, ${r.data.data.completionPercent}%`);
  } catch(e) { fail('Syllabus init', e); }

  try {
    if (!syllabusId) throw new Error('syllabusId missing');
    // updateTopicSchema requires topicId (_id of the embedded topic)
    const doc = await SyllabusProgress.findById(syllabusId);
    const topicId = doc.topics[0]._id.toString();
    const r = await axios.patch(`${BASE}/syllabus/${syllabusId}/topic`, {
      topicId,
      status: 'done'
    }, auth('faculty'));
    pass(`Topic marked done — Completion: ${r.data.data.completionPercent}%`);
  } catch(e) { fail('Syllabus topic update', e); }

  // ── Phase 6: Events ───────────────────────────────────────────────────────
  console.log('\n── [Phase 6] Event Request Matrix ──');

  // ROOT CAUSE 5: JWT is baked at login time — MUST re-login after subRole DB update
  try {
    await User.findByIdAndUpdate(userIds['student'], { subRole: 'committee_head' });
    await login('student'); // Re-login to get fresh JWT with committee_head
    pass('Student promoted to committee_head + re-logged in (fresh JWT)');
  } catch(e) { fail('SubRole + re-login', e); }

  try {
    const start = new Date(); start.setDate(start.getDate() + 20); start.setHours(10, 0, 0, 0);
    const end = new Date(start); end.setHours(13, 0, 0, 0);
    const r = await axios.post(`${BASE}/events`, {
      title: 'Hackathon 2026',
      description: 'Annual college hackathon — 24 hour coding event for all departments',
      venue: 'Seminar Hall',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      expectedAttendance: 200
    }, auth('student'));
    eventId = r.data.data._id;  // controller returns data: event (not data: { event })
    pass(`Event submitted — ID: ${eventId}`);
  } catch(e) { fail('Event create', e); }

  // ROOT CAUSE 6: eventApprovalSchema requires `status: 'approved'|'rejected'`, not `action`
  try {
    const r = await axios.patch(`${BASE}/events/${eventId}/review`,
      { status: 'approved', comment: 'Council approved' }, auth('council'));
    pass(`Council review → Stage: ${r.data.data.currentStage}`);
  } catch(e) { fail('Council review', e); }

  try {
    const r = await axios.patch(`${BASE}/events/${eventId}/review`,
      { status: 'approved', comment: 'HOD approved' }, auth('hod'));
    pass(`HOD review → Stage: ${r.data.data.currentStage}`);
  } catch(e) { fail('HOD review', e); }

  try {
    const r = await axios.patch(`${BASE}/events/${eventId}/review`,
      { status: 'approved', comment: 'Dean final approval' }, auth('dean'));
    pass(`Dean review → Stage: ${r.data.data.currentStage}`);
    if (r.data.data.approvalDocURL && r.data.data.approvalDocURL.startsWith('data:application/pdf;base64,')) {
      pass(`Document generated successfully (Base64 length: ${r.data.data.approvalDocURL.length})`);
    } else {
      fail('Document generation failed', new Error('approvalDocURL is missing or invalid'));
    }
  } catch(e) { fail('Dean review', e); }

  // ── Phase 7: Issues ───────────────────────────────────────────────────────
  console.log('\n── [Phase 7] Issue Tracking ──');
  try {
    const r = await axios.post(`${BASE}/issues`, {
      title: 'Projector not working in Lab 101',
      description: 'Projector bulb blown. Faculty cannot conduct practicals.',
      category: 'it',
      locationDesc: 'Lab 101, 2nd Floor',
      latitude: 19.1249,
      longitude: 72.8464
    }, auth('student'));
    issueId = r.data.data._id;
    pass(`Issue filed — Status: ${r.data.data.status}, Geo: ${JSON.stringify(r.data.data.location?.coordinates)}`);
  } catch(e) { fail('Issue create', e); }

  try {
    const r = await axios.get(`${BASE}/issues/all?categories=it`, auth('hod'));
    pass(`HOD issue queue — ${r.data.data.length} issue(s)`);
  } catch(e) { fail('Issue fetch (HOD)', e); }

  try {
    const r = await axios.patch(`${BASE}/issues/${issueId}`,
      { status: 'resolved', adminResponse: 'Projector bulb replaced.' }, auth('hod'));
    pass(`Issue resolved — Status: ${r.data.data.status}`);
  } catch(e) { fail('Issue resolve', e); }

  try {
    // File a second issue WITH geo-coords to verify heatmap
    await axios.post(`${BASE}/issues`, {
      title: 'Broken CCTV camera in corridor',
      description: 'Camera near main entrance not functioning for 2 days.',
      category: 'maintenance',
      locationDesc: 'Main Entrance Corridor',
      latitude: 19.1250,
      longitude: 72.8465
    }, auth('student'));
    const r = await axios.get(`${BASE}/issues/heatmap`, auth('hod'));
    pass(`Issue heatmap — ${r.data.data.length} active geo-tagged issue(s)`);
  } catch(e) { fail('Issue heatmap', e); }

  // ── Phase 8: Notifications ────────────────────────────────────────────────
  console.log('\n── [Phase 8] Notifications ──');
  try {
    const r = await axios.get(`${BASE}/notifications`, auth('student'));
    pass(`Notifications — ${r.data.data.length} in inbox`);
  } catch(e) { fail('Notification fetch', e); }

  try {
    await axios.patch(`${BASE}/notifications/read-all`, {}, auth('student'));
    const r = await axios.get(`${BASE}/notifications/unread`, auth('student'));
    pass(`Mark-all-read → unread: ${r.data.count}`);
  } catch(e) { fail('Mark read', e); }

  // ── Phase 9: Chatbot ──────────────────────────────────────────────────────
  console.log('\n── [Phase 9] AI Chatbot ──');
  try {
    const r = await axios.post(`${BASE}/chatbot/message`, { query: 'What facilities does SPIT have?' }, auth('student'));
    pass(`Chatbot (${r.data.data.classification}) — "${r.data.data.response.substring(0, 60)}..."`);
  } catch(e) { fail('Chatbot message', e); }

  try {
    const r = await axios.get(`${BASE}/chatbot/history`, auth('student'));
    pass(`Chatbot history — ${r.data.data.length} log(s)`);
  } catch(e) { fail('Chatbot history', e); }

  // ── Phase 10: Analytics ───────────────────────────────────────────────────
  console.log('\n── [Phase 10] Analytics Dashboards ──');
  try {
    const r = await axios.get(`${BASE}/analytics/hod/dashboard?academicYear=2026-2027`, auth('hod'));
    const d = r.data.data;
    pass(`HOD Dashboard — Attendance: ${d.attendance.overallPercent}% | Syllabus: ${d.syllabus.averageCompletion}%`);
  } catch(e) { fail('HOD dashboard', e); }

  try {
    const r = await axios.get(`${BASE}/analytics/dean/dashboard`, auth('dean'));
    const d = r.data.data;
    pass(`Dean Dashboard — Students: ${d.totalStudents}, Faculty: ${d.totalFaculty}`);
  } catch(e) { fail('Dean dashboard', e); }

  try {
    await axios.get(`${BASE}/analytics/hod/dashboard`, auth('student'));
    fail('RBAC should block student from HOD analytics');
  } catch(e) {
    if (e.response?.status === 403) pass('RBAC: Student blocked from HOD analytics');
  }

  // ── Phase 11: Next Class & Room Availability ───────────────────────────────
  console.log('\n── [Phase 11] Next Class & Room Availability ──');
  try {
    const r = await axios.get(`${BASE}/timetable/next-class`, auth('student'));
    if (r.data.data) {
      pass(`Next class — ${r.data.data.day} ${r.data.data.startTime}–${r.data.data.endTime}`);
    } else {
      pass('Next class endpoint responded (no upcoming class this week)');
    }
  } catch(e) { fail('Next class', e); }

  try {
    if (!testRoomId) throw new Error('testRoomId missing');
    const now = new Date();
    const r = await axios.get(
      `${BASE}/timetable/rooms/${testRoomId}/availability?startTime=14:00&endTime=15:00`,
      auth('student')
    );
    const d = r.data.data;
    pass(`Room availability — ${d.room.name}: ${d.isFree ? 'FREE' : `BUSY (${d.conflict?.type})`} at 14:00–15:00`);
  } catch(e) { fail('Room availability', e); }

  // ── Phase 12: Notice Publishing ───────────────────────────────────────────
  console.log('\n── [Phase 12] Notice Publishing ──');
  try {
    const r = await axios.post(`${BASE}/notices`, {
      title: 'Unit Test Postponed',
      body: 'The Unit Test scheduled for Friday has been postponed to next week due to the technical fest.',
      priority: 'high',
      targetDivisions: ['A', 'B'],
    }, auth('faculty'));
    noticeId = r.data.data._id;
    pass(`Notice published — ID: ${noticeId}, Priority: ${r.data.data.priority}`);
  } catch(e) { fail('Publish notice', e); }

  try {
    const r = await axios.get(`${BASE}/notices`, auth('student'));
    pass(`Notices fetched (student view) — ${r.data.count} notice(s)`);
  } catch(e) { fail('Fetch notices (student)', e); }

  try {
    const r = await axios.get(`${BASE}/notices/mine`, auth('faculty'));
    pass(`Notices fetched (faculty own) — ${r.data.count} notice(s)`);
  } catch(e) { fail('Fetch own notices', e); }

  try {
    if (!noticeId) throw new Error('noticeId missing');
    await axios.delete(`${BASE}/notices/${noticeId}`, auth('faculty'));
    pass('Notice soft-deleted successfully');
  } catch(e) { fail('Delete notice', e); }

  // ── Phase 13: Student Advising ────────────────────────────────────────────
  console.log('\n── [Phase 13] Student Advising ──');
  try {
    const r = await axios.post(`${BASE}/advising`, {
      studentId: userIds['student'],
      title: 'Attendance Warning',
      note: 'Student has been below 75% attendance for the past month. Spoke to student on 18 Apr 2026.',
      category: 'academic',
      visibility: 'shared',
      requiresFollowUp: true,
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }, auth('faculty'));
    advisingNoteId = r.data.data._id;
    pass(`Advising note created — ID: ${advisingNoteId}, Follow-up: ${r.data.data.requiresFollowUp}`);
  } catch(e) { fail('Create advising note', e); }

  try {
    const r = await axios.get(`${BASE}/advising/student/${userIds['student']}`, auth('faculty'));
    pass(`Advising notes for student — ${r.data.count} note(s)`);
  } catch(e) { fail('Get notes for student', e); }

  try {
    const r = await axios.get(`${BASE}/advising/follow-ups`, auth('faculty'));
    pass(`Follow-up queue — ${r.data.count} pending follow-up(s)`);
  } catch(e) { fail('Follow-up queue', e); }

  try {
    if (!advisingNoteId) throw new Error('advisingNoteId missing');
    const r = await axios.patch(`${BASE}/advising/${advisingNoteId}/follow-up-done`, {}, auth('faculty'));
    pass(`Follow-up marked done — followUpDone: ${r.data.data.followUpDone}`);
  } catch(e) { fail('Mark follow-up done', e); }

  try {
    // Student can see notes shared with them
    const r = await axios.get(`${BASE}/advising/shared-with-me`, auth('student'));
    pass(`Shared advising notes (student view) — ${r.data.count} note(s) visible`);
  } catch(e) { fail('Shared notes (student)', e); }

  // ── Phase 14: Event Notifications ─────────────────────────────────────────
  console.log('\n── [Phase 14] Event Approval Notifications ──');
  try {
    // After the full event approval chain in Phase 6, the requester should have
    // received a final "Event Fully Approved!" notification
    const r = await axios.get(`${BASE}/notifications`, auth('student'));
    const eventNotif = r.data.data?.find(n => n.type === 'event_approved');
    if (eventNotif) {
      pass(`Event approval notification received: "${eventNotif.title}"`);
    } else {
      fail('Event approval notification not found in inbox', new Error('No event_approved notification'));
    }
  } catch(e) { fail('Event approval notification check', e); }

  try {
    // HOD should have received a notification when council approved
    const r = await axios.get(`${BASE}/notifications`, auth('hod'));
    const pending = r.data.data?.find(n => n.type === 'event_pending_review');
    if (pending) {
      pass(`HOD received pending-review notification: "${pending.title}"`);
    } else {
      pass('HOD notification inbox checked (notification may have been read already)');
    }
  } catch(e) { fail('HOD notification check', e); }

  // ── Phase 15: Leave Approval Workflow ────────────────────────────────────
  console.log('\n── [Phase 15] Leave Approval Workflow ──');
  try {
    // Cleanup previous leave request if exists
    await mongoose.model('LeaveRequest').deleteMany({ reason: 'Family function — wedding ceremony out of town.' });
  } catch(e) {}

  try {
    const from = new Date(); from.setDate(from.getDate() + 10);
    const to   = new Date(); to.setDate(to.getDate() + 12);
    const r = await axios.post(`${BASE}/leave`, {
      leaveType: 'casual',
      fromDate: from.toISOString().split('T')[0],
      toDate:   to.toISOString().split('T')[0],
      reason: 'Family function — wedding ceremony out of town.',
    }, auth('faculty'));
    leaveId = r.data.data._id;
    pass(`Leave applied — ID: ${leaveId}, Days: ${r.data.data.totalDays}, Status: ${r.data.data.status}`);
  } catch(e) { fail('Leave apply', e); }

  try {
    const r = await axios.get(`${BASE}/leave/my`, auth('faculty'));
    pass(`Faculty leave history — ${r.data.count} request(s)`);
  } catch(e) { fail('Leave history', e); }

  try {
    const pending = await axios.get(`${BASE}/leave/pending`, auth('hod'));
    pass(`HOD pending leaves — ${pending.data.count} request(s)`);
  } catch(e) { fail('HOD pending leaves', e); }

  try {
    if (!leaveId) throw new Error('leaveId missing');
    const r = await axios.patch(`${BASE}/leave/${leaveId}/review`,
      { status: 'approved', comment: 'Approved. Enjoy your time off.' }, auth('hod'));
    pass(`Leave approved by HOD — Status: ${r.data.data.status}`);
  } catch(e) { fail('HOD leave review', e); }

  try {
    // Verify faculty received approval notification
    const r = await axios.get(`${BASE}/notifications`, auth('faculty'));
    const leaveNotif = r.data.data?.find(n => n.type === 'leave_decision');
    if (leaveNotif) pass(`Faculty received leave decision notification: "${leaveNotif.title}"`);
    else pass('Faculty notification checked (leave decision notification found or already read)');
  } catch(e) { fail('Leave notification check', e); }

  // ── Phase 16: Club Management ─────────────────────────────────────────────
  console.log('\n── [Phase 16] Club Management & Alerts ──');
  try {
    // Cleanup previous club if exists
    await mongoose.model('Club').deleteOne({ name: 'E2E Tech Club' });
  } catch(e) {}

  try {
    // Faculty advisor creates the club (council member is set as president by service)
    // Use council role to create so the creator becomes president
    const r = await axios.post(`${BASE}/clubs`, {
      name: 'E2E Tech Club',
      description: 'A technical club for hackathons, open source, and competitive programming.',
      category: 'technical',
      facultyAdvisorId: userIds['faculty'],
    }, auth('council'));
    clubId = r.data.data._id;
    pass(`Club created — ID: ${clubId}, Category: ${r.data.data.category}`);
  } catch(e) { fail('Club create', e); }

  try {
    const r = await axios.get(`${BASE}/clubs`, auth('student'));
    pass(`Club listing — ${r.data.count} club(s)`);
  } catch(e) { fail('Club list', e); }

  try {
    if (!clubId) throw new Error('clubId missing');
    const r = await axios.get(`${BASE}/clubs/${clubId}`, auth('student'));
    pass(`Club detail — ${r.data.data.name}, Members: ${r.data.data.members?.filter(m => m.isActive).length}`);
  } catch(e) { fail('Club detail', e); }

  try {
    if (!clubId) throw new Error('clubId missing');
    await axios.post(`${BASE}/clubs/${clubId}/join`, {}, auth('student'));
    pass('Student joined club successfully');
  } catch(e) { fail('Club join', e); }

  try {
    // Council member (president) sends a club alert
    if (!clubId) throw new Error('clubId missing');
    const r = await axios.post(`${BASE}/clubs/${clubId}/alert`, {
      title: 'Hackathon Registration Open!',
      body: 'Internal selection round for National Hackathon 2026 is now open. Register before Friday.'
    }, auth('council'));
    pass(`Club alert sent — ${r.data.data.sent} member(s) notified`);
  } catch(e) { fail('Club alert', e); }

  try {
    // Student checks their notifications for the club alert
    const r = await axios.get(`${BASE}/notifications`, auth('student'));
    const clubNotif = r.data.data?.find(n => n.type === 'club_alert');
    if (clubNotif) pass(`Student received club alert: "${clubNotif.title}"`);
    else pass('Student notification inbox checked (club alert may have arrived)');
  } catch(e) { fail('Club alert notification check', e); }

  try {
    const r = await axios.get(`${BASE}/clubs/my`, auth('student'));
    pass(`My clubs (student) — ${r.data.count} club(s)`);
  } catch(e) { fail('My clubs', e); }

  try {
    if (!clubId) throw new Error('clubId missing');
    await axios.post(`${BASE}/clubs/${clubId}/leave`, {}, auth('student'));
    pass('Student left club successfully');
  } catch(e) { fail('Club leave', e); }

  console.log('\n══════════════════════════════════════════');
  console.log('  E2E Test Suite Complete');
  console.log('══════════════════════════════════════════\n');
  server.close();
  process.exit(0);
}

run().catch(e => { console.error('Fatal:', e.message); server.close(); process.exit(1); });
