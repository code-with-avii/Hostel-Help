import UserProfile from '../models/UserProfile.js';
import User from '../models/User.js';

export async function getProfile(req, res) {
  try {
    const email = req.user.email.toLowerCase();
    const profile = await UserProfile.findOne({ email });
    let memberSinceYear = '';
    try {
      const user = await User.findOne({ email }).select({ createdAt: 1 });
      if (user?.createdAt) memberSinceYear = new Date(user.createdAt).getFullYear().toString();
    } catch (_) {}

    res.json({
      email,
      year: profile?.year || '',
      department: profile?.department || '',
      number: profile?.number || '',
      memberSinceYear,
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

export async function saveProfile(req, res) {
  try {
    const email = req.user.email.toLowerCase();
    const { year, department, number } = req.body || {};
    const saved = await UserProfile.findOneAndUpdate(
      { email },
      { $set: { year: year || '', department: department || '', number: number || '' } },
      { upsert: true, new: true }
    );
    res.status(200).json(saved);
  } catch (err) {
    console.error('Error saving profile:', err);
    res.status(500).json({ error: 'Failed to save profile' });
  }
}
