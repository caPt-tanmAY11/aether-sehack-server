import mongoose, { Schema } from 'mongoose';

const StudentLeaveSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    facultyId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    reason: { type: String, required: true },
    leaveType: { type: String, enum: ['medical', 'personal', 'family', 'other'], default: 'personal' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    remarks: { type: String, default: '' },
  },
  { timestamps: true }
);

StudentLeaveSchema.index({ studentId: 1, createdAt: -1 });
StudentLeaveSchema.index({ facultyId: 1, status: 1 });

export const StudentLeave = mongoose.model('StudentLeave', StudentLeaveSchema);
