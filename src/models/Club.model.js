import mongoose, { Schema } from 'mongoose';

// Club membership sub-document
const MembershipSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role:      { type: String, enum: ['president', 'vice_president', 'secretary', 'treasurer', 'member'], default: 'member' },
  joinedAt:  { type: Date, default: Date.now },
  isActive:  { type: Boolean, default: true }
}, { _id: false });

// Pending join request sub-document
const JoinRequestSchema = new Schema({
  userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message:     { type: String, maxLength: 300, default: '' },
  requestedAt: { type: Date, default: Date.now },
  status:      { type: String, enum: ['pending', 'approved', 'rejected', 'waitlisted'], default: 'pending' },
  reviewedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt:  { type: Date },
}, { _id: true });

const ClubSchema = new Schema({
  name:         { type: String, required: true, unique: true, trim: true },
  description:  { type: String, required: true, trim: true, maxLength: 2000 },
  category: {
    type: String,
    enum: ['technical', 'cultural', 'sports', 'social', 'academic', 'entrepreneurship', 'other'],
    required: true
  },

  // Faculty advisor — from the faculty pool
  facultyAdvisorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  // Department the club is primarily under (cross-dept clubs use the founder's dept)
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },

  // Active members
  members: [MembershipSchema],

  // Pending join requests awaiting president/advisor review
  joinRequests: [JoinRequestSchema],

  // Social / contact
  logoUrl:   { type: String },
  instagramHandle: { type: String },
  email:     { type: String },

  isActive:  { type: Boolean, default: true },
}, { timestamps: true });

ClubSchema.index({ category: 1 });
ClubSchema.index({ departmentId: 1 });
ClubSchema.index({ 'members.userId': 1 });

export const Club = mongoose.model('Club', ClubSchema);
