import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";

export async function getUserFromReq(req) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });
    if (session?.user) {
      const email = (session.user.email || '').toLowerCase();
      const adminEmail = (process.env.admin_email || 'admin@hostel.com').toLowerCase();
      const isAdmin = session.user.role === 'admin' || email === adminEmail;
      return {
        id: session.user.id,
        email,
        name: session.user.name,
        role: isAdmin ? 'admin' : (session.user.role || 'user')
      };
    }
  } catch (err) {
    console.error("Better Auth session error:", err?.message);
  }
  return { email: '', role: 'guest' };
}

export async function authenticate(req, res, next) {
  const user = await getUserFromReq(req);
  if (!user.email || user.role === 'guest') {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.user = user;
  next();
}

export async function requireAdmin(req, res, next) {
  const user = req.user || await getUserFromReq(req);
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  req.user = user;
  next();
}
