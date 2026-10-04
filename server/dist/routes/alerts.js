import { Router } from 'express';
import { db } from '../db/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { recordAuditLog } from '../middleware/audit.js';
const router = Router();
// -------------------------------------------------------------
// GET /api/alerts
// -------------------------------------------------------------
router.get('/', authenticate, (req, res) => {
    try {
        const user = req.user;
        const { status, severity, page, limit } = req.query;
        const targetUserId = user.role === 'user' ? user.id : undefined;
        const result = db.getAlerts({
            status: status,
            severity: severity,
            userId: targetUserId,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 15
        });
        res.json(result);
    }
    catch (err) {
        console.error('Error fetching alerts:', err);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});
// -------------------------------------------------------------
// PATCH /api/alerts/:id (Update alert status)
// -------------------------------------------------------------
router.patch('/:id', authenticate, requireRole(['admin', 'analyst']), (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        const validStatuses = ['new', 'investigating', 'resolved', 'dismissed'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
            return;
        }
        db.updateAlertStatus(id, status, req.user.name);
        recordAuditLog(req, 'Alert Status Updated', `Alert ${id} updated to '${status}' by ${req.user.name} (${req.user.role}).`);
        res.json({
            success: true,
            message: `Alert ${id} marked as ${status}.`
        });
    }
    catch (err) {
        console.error('Error updating alert:', err);
        res.status(500).json({ error: 'Failed to update alert' });
    }
});
export default router;
