import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/db.js';
import { UserRole } from '../types/shared.js';

const JWT_SECRET = process.env.JWT_SECRET || 'finshield_intelligent_fraud_detection_secret_key_2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Missing token.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string; role: UserRole };
    const user = db.getUserById(decoded.id);

    if (!user) {
      res.status(401).json({ error: 'User account not found.' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ error: 'This account has been suspended by an administrator.' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired authentication session.' });
    return;
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: `Forbidden: Access requires one of [${allowedRoles.join(', ')}] permissions. Current role is '${req.user.role}'.` 
      });
      return;
    }

    next();
  };
}

export function generateToken(user: { id: string; email: string; name: string; role: UserRole }): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
