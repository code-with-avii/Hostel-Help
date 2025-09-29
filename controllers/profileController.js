import UserProfile from '../models/UserProfile.js';
import User from '../models/User.js';

export async function getProfile(req, res) {
  try {
    const email = (req.query.email || '').toLowerCase();
    if (!email) return res.status(400).json({ error: 'email query required' });
    const profile = await UserProfile.findOne({ email });
    let memberSinceYear = '';
    try {
      const user = await User.findOne({ email }).select({ createdAt: 1 });
      if (user && user.createdAt) {
        memberSinceYear = new Date(user.createdAt).getFullYear().toString();
      }
    } catch (_) {}
    const resp = profile ? {
      email,
      year: profile.year || '',
      department: profile.department || '',
      number: profile.number || '',
      memberSinceYear,
    } : { email, year: '', department: '', number: '', memberSinceYear };
    res.json(resp);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

export async function saveProfile(req, res) {
  try {
    const { email, year, department, number } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email is required' });
    const saved = await UserProfile.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $set: { year: year || '', department: department || '', number: number || '' } },
      { upsert: true, new: true }
    );
    res.status(200).json(saved);
  } catch (err) {
    console.error('Error saving profile:', err);
    res.status(500).json({ error: 'Failed to save profile' });
  }
}
