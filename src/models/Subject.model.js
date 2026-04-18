import mongoose, { Schema } from 'mongoose';

const SubjectSchema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    credits: { type: Number, required: true, min: 1, max: 6 },
    semester: { type: Number, required: true, min: 1, max: 8 },
    syllabusPDF: { type: String },
  },
  { timestamps: true }
);

SubjectSchema.index({ departmentId: 1, semester: 1 });

export const Subject = mongoose.model('Subject', SubjectSchema);
