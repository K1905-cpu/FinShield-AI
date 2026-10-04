import { Router } from 'express';
import { db } from '../db/db.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
router.get('/', authenticate, (_req, res) => {
    try {
        const metrics = db.calculateDashboardMetrics();
        res.json(metrics);
    }
    catch (err) {
        console.error('Error fetching dashboard metrics:', err);
        res.status(500).json({ error: 'Failed to calculate dashboard metrics' });
    }
});
export default router;
