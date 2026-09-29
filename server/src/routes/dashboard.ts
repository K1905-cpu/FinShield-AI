import { Router, Response } from 'express';
import { db } from '../db/db.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, (_req: AuthRequest, res: Response) => {
  try {
    const metrics = db.calculateDashboardMetrics();
    res.json(metrics);
  } catch (err: any) {
    console.error('Error fetching dashboard metrics:', err);
    res.status(500).json({ error: 'Failed to calculate dashboard metrics' });
  }
});

export default router;
