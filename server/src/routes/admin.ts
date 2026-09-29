import { Router, Response } from 'express';
import { db } from '../db/db.js';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.js';
import { recordAuditLog } from '../middleware/audit.js';

const router = Router();

// Only Admin can access these routes
router.use(authenticate, requireRole(['admin']));

// -------------------------------------------------------------
// GET /api/admin/users
// -------------------------------------------------------------
router.get('/users', (_req: AuthRequest, res: Response) => {
  try {
    const users = db.getUsers();
    res.json({ users });
  } catch (err: any) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// -------------------------------------------------------------
// PATCH /api/admin/users/:id/role
// -------------------------------------------------------------
router.patch('/users/:id/role', (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { role } = req.body;

    if (!['admin', 'analyst', 'user'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    db.updateUserRole(id, role);
    recordAuditLog(req, 'User Role Changed', `User ${id} role updated to ${role}`);

    res.json({ success: true, message: `User role changed to ${role}` });
  } catch (err: any) {
    console.error('Error updating role:', err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// -------------------------------------------------------------
// PATCH /api/admin/users/:id/status
// -------------------------------------------------------------
router.patch('/users/:id/status', (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    db.updateUserStatus(id, status);
    recordAuditLog(req, 'User Status Changed', `User ${id} account marked as ${status}`);

    res.json({ success: true, message: `User status changed to ${status}` });
  } catch (err: any) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// -------------------------------------------------------------
// GET /api/admin/rules
// -------------------------------------------------------------
router.get('/rules', (_req: AuthRequest, res: Response) => {
  try {
    const rules = db.getRules();
    res.json({ rules });
  } catch (err: any) {
    console.error('Error fetching rules:', err);
    res.status(500).json({ error: 'Failed to fetch fraud rules' });
  }
});

// -------------------------------------------------------------
// PATCH /api/admin/rules
// -------------------------------------------------------------
router.patch('/rules', (req: AuthRequest, res: Response) => {
  try {
    const {
      highValueThreshold,
      velocityWindowMinutes,
      velocityCountThreshold,
      unusualHoursStart,
      unusualHoursEnd,
      highRiskMerchantCategories,
      weights
    } = req.body;

    const current = db.getRules();

    const updated = {
      highValueThreshold: highValueThreshold !== undefined ? Number(highValueThreshold) : current.highValueThreshold,
      velocityWindowMinutes: velocityWindowMinutes !== undefined ? Number(velocityWindowMinutes) : current.velocityWindowMinutes,
      velocityCountThreshold: velocityCountThreshold !== undefined ? Number(velocityCountThreshold) : current.velocityCountThreshold,
      unusualHoursStart: unusualHoursStart !== undefined ? Number(unusualHoursStart) : current.unusualHoursStart,
      unusualHoursEnd: unusualHoursEnd !== undefined ? Number(unusualHoursEnd) : current.unusualHoursEnd,
      highRiskMerchantCategories: Array.isArray(highRiskMerchantCategories) ? highRiskMerchantCategories : current.highRiskMerchantCategories,
      weights: {
        amountAnomaly: weights?.amountAnomaly !== undefined ? Number(weights.amountAnomaly) : current.weights.amountAnomaly,
        frequencyAnomaly: weights?.frequencyAnomaly !== undefined ? Number(weights.frequencyAnomaly) : current.weights.frequencyAnomaly,
        locationAnomaly: weights?.locationAnomaly !== undefined ? Number(weights.locationAnomaly) : current.weights.locationAnomaly,
        timeAnomaly: weights?.timeAnomaly !== undefined ? Number(weights.timeAnomaly) : current.weights.timeAnomaly,
        merchantRisk: weights?.merchantRisk !== undefined ? Number(weights.merchantRisk) : current.weights.merchantRisk,
        deviceAnomaly: weights?.deviceAnomaly !== undefined ? Number(weights.deviceAnomaly) : current.weights.deviceAnomaly,
        behavioralAnomaly: weights?.behavioralAnomaly !== undefined ? Number(weights.behavioralAnomaly) : current.weights.behavioralAnomaly,
      }
    };

    db.updateRules(updated);

    recordAuditLog(
      req,
      'Fraud Rules Reconfigured',
      `Fraud engine rules updated. High-value threshold: ₹${updated.highValueThreshold}, Velocity window: ${updated.velocityWindowMinutes}m.`
    );

    res.json({
      success: true,
      message: 'Fraud engine rules successfully updated and active.',
      rules: updated
    });
  } catch (err: any) {
    console.error('Error updating rules:', err);
    res.status(500).json({ error: 'Failed to update fraud rules' });
  }
});

// -------------------------------------------------------------
// GET /api/admin/audit-logs
// -------------------------------------------------------------
router.get('/audit-logs', (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search } = req.query;
    const result = db.getAuditLogs({
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
      search: search as string
    });
    res.json(result);
  } catch (err: any) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
