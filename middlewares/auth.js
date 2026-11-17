import { verifyToken } from '../utils/jwt.js';

export function getUserFromReq(req) {
  const auth = req.headers['authorization'] || '';
  if (auth.startsWith('Bearer ')) {
    const decoded = verifyToken(auth.slice(7));
    if (decoded?.email) {
      const email = decoded.email.toLowerCase();
      const isAdmin = decoded.role === 'admin' || email === (process.env.admin_email || '').toLowerCase();
      return { email, role: isAdmin ? 'admin' : 'user', id: decoded.id };
    }
  }
  return { email: '', role: 'guest' };
}

export function authenticate(req, res, next) {
  const user = getUserFromReq(req);
  if (!user.email || user.role === 'guest') {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.user = user;
  next();
}

export function requireAdmin(req, res, next) {
  const user = req.user || getUserFromReq(req);
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  req.user = user;
  next();
}
