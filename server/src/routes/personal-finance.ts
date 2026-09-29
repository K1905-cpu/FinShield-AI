import { Router, Response } from 'express';
import { db } from '../db/db.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const summary = db.calculatePersonalFinance(userId);
    res.json(summary);
  } catch (err: any) {
    console.error('Error fetching personal finance summary:', err);
    res.status(500).json({ error: 'Failed to fetch personal finance analytics' });
  }
});

export default router;
