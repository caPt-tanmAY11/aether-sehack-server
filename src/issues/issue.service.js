import { Issue, User } from '../shared.js';

class IssueService {
  async raiseIssue(userId, data) {
    const issue = await Issue.create({
      reportedBy: userId,
      title: data.title,
      description: data.description,
      category: data.category,
      location: data.location,
      status: 'open',
    });
    return issue;
  }

  async getMyIssues(userId) {
    return Issue.find({ reportedBy: userId }).sort({ createdAt: -1 });
  }

  async getAllIssues(role, categoryFilters) {
    let filter = {};
    if (categoryFilters && categoryFilters.length > 0) {
      filter.category = { $in: categoryFilters };
    }
    
    return Issue.find(filter)
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
  }

  async processIssue(issueId, adminId, updates) {
    const issue = await Issue.findById(issueId);
    if (!issue) throw { status: 404, message: 'Issue not found' };

    if (updates.status) issue.status = updates.status;
    if (updates.adminResponse) {
      issue.adminResponse = updates.adminResponse;
      issue.assignedTo = adminId;
      if (updates.status === 'resolved') {
        issue.resolvedAt = new Date();
      }
    }

    await issue.save();
    return issue;
  }
}

export const issueService = new IssueService();
