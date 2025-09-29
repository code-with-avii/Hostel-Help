import { verifyToken } from '../utils/jwt.js';

export function getUserFromReq(req) {
  const auth = req.headers['authorization'] || '';
  if (auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    const decoded = verifyToken(token);
    if (decoded && decoded.email) {
      return { email: (decoded.email || '').toLowerCase(), role: decoded.role || 'user' };
    }
  }
  const emailHeader = (req.headers['x-user-email'] || '').toString().toLowerCase();
  return { email: emailHeader, role: emailHeader ? (emailHeader === (process.env.admin_email || '').toLowerCase() ? 'admin' : 'user') : 'guest' };
}

export function requireAdmin(req, res, next) {
  const user = getUserFromReq(req);
  if ((user.email || '') !== (process.env.admin_email || '').toLowerCase()) {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  next();
}
