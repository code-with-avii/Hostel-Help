import mongoose from 'mongoose';

const userProfileSchema = new mongoose.Schema({
    email: { type: String, required: true, trim: true, lowercase: true},
    year: { type: String, default: '' },
    department: { type: String, default: '' },
    number: { type: String, default: '' }
}, { timestamps: true });

userProfileSchema.index({ email: 1 });

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

export default UserProfile;


