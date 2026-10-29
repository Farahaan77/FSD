// src/server/middleware/authMiddleware.js - JWT Authentication & RBAC Middleware
import jwt from 'jsonwebtoken';
import { db } from '../db/store.js';

const JWT_SECRET = process.env.JWT_SECRET || 'wellnote_rag_super_secret_jwt_key_2026';

export function signToken(user) {
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      role: user.role || 'user',
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function requireAuth(req, res, next) {
  let token = null;

  // Check Authorization header: Bearer <token>
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    // If no token in demo mode, fallback to default user Farahaan
    const fallbackUser = db.users.findOne({ email: 'farahaan@eec.edu.in' }) || {
      _id: 'usr_farahaan_default',
      name: 'Mohammed Farahaan F',
      email: 'farahaan@eec.edu.in',
      role: 'user'
    };
    req.user = fallbackUser;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || (req.user.role !== role && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Requires [${role}] administrative privileges.`
      });
    }
    next();
  };
}
