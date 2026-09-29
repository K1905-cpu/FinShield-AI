import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/db.js';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.js';
import { recordAuditLog } from '../middleware/audit.js';

const router = Router();

router.get('/', authenticate, requireRole(['admin', 'analyst']), (_req: AuthRequest, res: Response) => {
  try {
    const reports = db.getReports();
    res.json({ reports });
  } catch (err: any) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

router.post('/generate', authenticate, requireRole(['admin', 'analyst']), (req: AuthRequest, res: Response) => {
  try {
    const { type, name, startDate, endDate } = req.body;

    let txs = [...db.getState().transactions];
    if (startDate) {
      txs = txs.filter(t => new Date(t.timestamp) >= new Date(startDate));
    }
    if (endDate) {
      txs = txs.filter(t => new Date(t.timestamp) <= new Date(endDate));
    }

    let records: any[] = [];
    let summary = '';
    const reportType = type || 'fraud';
    const reportName = name || `FinShield ${reportType.toUpperCase()} Audit Report`;

    if (reportType === 'fraud') {
      records = txs.filter(t => t.riskLevel === 'CRITICAL' || t.status === 'confirmed_fraud');
      summary = `Identified ${records.length} confirmed/critical fraud incidents totaling ₹${records.reduce((acc, r) => acc + r.amount, 0).toLocaleString()}.`;
    } else if (reportType === 'suspicious') {
      records = txs.filter(t => t.riskLevel === 'HIGH' || t.status === 'suspicious');
      summary = `Identified ${records.length} high-risk suspicious anomalies requiring compliance officer intervention.`;
    } else if (reportType === 'user_risk') {
      const users = db.getUsers();
      records = users.filter(u => u.riskLevel === 'HIGH' || u.riskLevel === 'CRITICAL');
      summary = `Evaluated ${users.length} accounts; flagged ${records.length} accounts displaying abnormal risk concentrations.`;
    } else {
      // General transactions
      records = txs.slice(0, 100);
      summary = `Overview of ${records.length} recent financial transactions audited by the FinShield engine.`;
    }

    const reportItem = {
      id: `REP-${uuidv4().slice(0, 6)}`,
      name: reportName,
      type: reportType,
      recordCount: records.length,
      summary,
      generatedBy: req.user!.name,
      generatedAt: new Date().toISOString()
    };

    db.addReport(reportItem);

    recordAuditLog(
      req,
      'Report Generated',
      `Generated '${reportName}' (${reportType}) containing ${records.length} records.`
    );

    res.json({
      success: true,
      report: reportItem,
      data: records
    });
  } catch (err: any) {
    console.error('Error generating report:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

export default router;
