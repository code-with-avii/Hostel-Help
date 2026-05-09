import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Student from '../models/Student.js';
import UserProfile from '../models/UserProfile.js';
import { signToken } from '../utils/jwt.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signup(req, res) {
  try {
    const { email, password } = req.body || {};
    const adminEmail = (process.env.admin_email || '').toLowerCase();
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'invalid email' });
    if (password.length < 6) return res.status(400).json({ error: 'password too short (min 6)' });
    const normalized = email.toLowerCase();
    if (normalized === adminEmail) {
      return res.status(400).json({ error: 'Cannot create admin via signup' });
    }
    // Validate email exists in students collection (allowlist)
    const student = await Student.findOne({ email: normalized });
    if (!student) {
      return res.status(403).json({ error: 'Email not found in student records' });
    }
    const existing = await User.findOne({ email: normalized });
    if (existing) return res.status(409).json({ error: 'User already exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email: normalized, passwordHash });
    // Prefill profile from Student if present (non-blocking)
    try {
      if (student) {
        await UserProfile.findOneAndUpdate(
          { email: normalized },
          { $set: {
              department: student.department || '',
              year: (student.year != null ? String(student.year) : ''),
              number: student.room || ''
            }
          },
          { upsert: true, new: true }
        );
      }
    } catch (e) {
      console.warn('Prefill profile failed:', e?.message);
    }
    return res.status(201).json({ email: user.email });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Failed to signup' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'invalid email' });
    const normalized = email.toLowerCase();
    const adminEmail = (process.env.admin_email || '').toLowerCase();
    const adminPassword = process.env.admin_password || '';
    if (normalized === adminEmail) {
      if (password === adminPassword) {
        const token = signToken({ email: normalized, role: 'admin' });
        return res.status(200).json({ email: normalized, role: 'admin', token });
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = await User.findOne({ email: normalized });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken({ email: user.email, role: 'user' });
    return res.status(200).json({ email: user.email, role: 'user', token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Failed to login' });
  }
}
