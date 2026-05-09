import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    firstName: { type: String },
    lastName: { type: String },
    dob: { type: String },
    gender: { type: String },
    department: { type: String },
    year: { type: Number },
    room: { type: String },
  },
  {
    timestamps: true,
    collection: 'students',
  }
);

StudentSchema.index({ email: 1 });

const Student = mongoose.models.Student || mongoose.model('Student', StudentSchema);
export default Student;
