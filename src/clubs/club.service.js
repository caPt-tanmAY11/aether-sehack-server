import { Club } from '../models/Club.model.js';
import { User } from '../shared.js';
import { notificationService } from '../notifications/notification.service.js';

class ClubService {
  /**
   * Council/Faculty Advisor creates a new club.
   */
  async create(actor, data) {
    const { name, description, category, facultyAdvisorId } = data;

    const existing = await Club.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (existing) throw { status: 409, message: `A club named "${name}" already exists` };

    const advisor = await User.findById(facultyAdvisorId || actor.userId);
    if (!advisor || advisor.role !== 'faculty')
      throw { status: 400, message: 'A valid faculty advisor is required' };

    const club = await Club.create({
      name,
      description,
      category,
      facultyAdvisorId: advisor._id,
      departmentId: actor.departmentId,
      members: [{
        userId: actor.userId,
        role: 'president',
        isActive: true
      }],
      logoUrl: data.logoUrl,
      instagramHandle: data.instagramHandle,
      email: data.email
    });

    return club;
  }

  /**
   * List all active clubs (optionally filtered by category).
   */
  async list(category) {
    const query = { isActive: true };
    if (category) query.category = category;
    return Club.find(query)
      .populate('facultyAdvisorId', 'name email')
      .populate('departmentId', 'name')
      .sort({ name: 1 });
  }

  /**
   * Get a single club with full member list.
   */
  async getById(clubId) {
    const club = await Club.findById(clubId)
      .populate('facultyAdvisorId', 'name email')
      .populate('departmentId', 'name')
      .populate('members.userId', 'name email division');
    if (!club || !club.isActive) throw { status: 404, message: 'Club not found' };
    return club;
  }

  /**
   * Student joins a club as a regular member.
   */
  async join(clubId, userId) {
    const club = await Club.findById(clubId);
    if (!club || !club.isActive) throw { status: 404, message: 'Club not found' };

    const already = club.members.find(m => m.userId.toString() === userId && m.isActive);
    if (already) throw { status: 409, message: 'You are already a member of this club' };

    club.members.push({ userId, role: 'member', isActive: true });
    await club.save();

    // Alert the club president and advisor
    const president = club.members.find(m => m.role === 'president' && m.isActive);
    if (president) {
      const joiner = await User.findById(userId).select('name');
      notificationService.send(president.userId, {
        title: `New Member Joined ${club.name}`,
        body: `${joiner?.name || 'A student'} has joined ${club.name}.`,
        type: 'club_member_joined',
        metadata: { clubId: club._id }
      }).catch(console.error);
    }

    return club;
  }

  /**
   * Member leaves a club.
   */
  async leave(clubId, userId) {
    const club = await Club.findById(clubId);
    if (!club) throw { status: 404, message: 'Club not found' };

    const memberIdx = club.members.findIndex(m => m.userId.toString() === userId && m.isActive);
    if (memberIdx === -1) throw { status: 404, message: 'You are not an active member of this club' };

    const member = club.members[memberIdx];
    if (member.role === 'president') throw { status: 400, message: 'President must transfer role before leaving' };

    club.members[memberIdx].isActive = false;
    await club.save();
    return { success: true };
  }

  /**
   * Send a broadcast alert to all active club members (president or advisor only).
   */
  async sendAlert(clubId, actorId, { title, body }) {
    const club = await Club.findById(clubId);
    if (!club || !club.isActive) throw { status: 404, message: 'Club not found' };

    // Only president or faculty advisor may send alerts
    const isAdvisor = club.facultyAdvisorId.toString() === actorId;
    const isPresident = club.members.some(m => m.userId.toString() === actorId && m.role === 'president' && m.isActive);
    if (!isAdvisor && !isPresident)
      throw { status: 403, message: 'Only the club president or faculty advisor can send alerts' };

    const activeMembers = club.members.filter(m => m.isActive && m.userId.toString() !== actorId);

    await Promise.all(activeMembers.map(m =>
      notificationService.send(m.userId, {
        title: `[${club.name}] ${title}`,
        body,
        type: 'club_alert',
        metadata: { clubId: club._id }
      }).catch(console.error)
    ));

    return { sent: activeMembers.length };
  }

  /**
   * Get all clubs the current user is a member of.
   */
  async getMyClubs(userId) {
    return Club.find({ 'members.userId': userId, 'members.isActive': true, isActive: true })
      .populate('facultyAdvisorId', 'name')
      .select('name category description members');
  }
}

export const clubService = new ClubService();
