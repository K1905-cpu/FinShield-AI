import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/db.js';
import { AuthRequest } from './auth.js';

export function recordAuditLog(
  req: AuthRequest,
  action: string,
  details: string
) {
  const user = req.user;
  db.addAuditLog({
    id: `LOG-${uuidv4().slice(0, 8)}`,
    userId: user?.id || 'system',
    userName: user?.name || 'System / Anonymous',
    userRole: user?.role || 'system',
    action,
    details,
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
    timestamp: new Date().toISOString()
  });
}
