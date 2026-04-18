import { Notification } from '../shared.js';
import { pushToUser } from './socket.server.js';

class NotificationService {
  /**
   * Create a DB notification record and push real-time event to user.
   */
  async send(userId, { title, body, type = 'general', metadata = {} }) {
    const notif = await Notification.create({
      userId,
      title,
      body,
      type,
      metadata,
      read: false
    });

    // Real-time push via Socket.io (non-blocking, fire-and-forget)
    pushToUser(userId.toString(), 'notification:new', {
      id: notif._id,
      title,
      body,
      type,
      createdAt: notif.createdAt
    });

    return notif;
  }

  async getUnread(userId) {
    return Notification.find({ userId, read: false })
      .sort({ createdAt: -1 })
      .limit(50);
  }

  async getAll(userId) {
    return Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(100);
  }

  async markRead(userId, notificationId) {
    const notif = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true, readAt: new Date() },
      { new: true }
    );
    if (!notif) throw { status: 404, message: 'Notification not found' };
    return notif;
  }

  async markAllRead(userId) {
    await Notification.updateMany(
      { userId, read: false },
      { read: true, readAt: new Date() }
    );
    return { success: true };
  }
}

export const notificationService = new NotificationService();
