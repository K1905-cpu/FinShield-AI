import { Router } from 'express';
import { db } from '../db/db.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
router.get('/', authenticate, (req, res) => {
    try {
        const { category, riskLevel, startDate, endDate } = req.query;
        let txs = [...db.getState().transactions];
        if (category && category !== 'all') {
            txs = txs.filter(t => t.category.toLowerCase() === category.toLowerCase());
        }
        if (riskLevel && riskLevel !== 'all') {
            txs = txs.filter(t => t.riskLevel.toUpperCase() === riskLevel.toUpperCase());
        }
        if (startDate) {
            txs = txs.filter(t => new Date(t.timestamp) >= new Date(startDate));
        }
        if (endDate) {
            txs = txs.filter(t => new Date(t.timestamp) <= new Date(endDate));
        }
        const totalTransactions = txs.length;
        const totalTransactionValue = txs.reduce((acc, t) => acc + t.amount, 0);
        const suspiciousCount = txs.filter(t => t.riskLevel === 'HIGH' || t.status === 'suspicious').length;
        const fraudCount = txs.filter(t => t.riskLevel === 'CRITICAL' || t.status === 'confirmed_fraud').length;
        const moneyAtRisk = txs.filter(t => t.riskScore >= 60).reduce((acc, t) => acc + t.amount, 0);
        const avgRiskScore = totalTransactions > 0
            ? Math.round(txs.reduce((acc, t) => acc + t.riskScore, 0) / totalTransactions)
            : 0;
        // By Category
        const catMap = new Map();
        txs.forEach(t => {
            const entry = catMap.get(t.category) || { total: 0, fraud: 0, suspicious: 0, amount: 0 };
            entry.total++;
            entry.amount += t.amount;
            if (t.riskScore >= 80 || t.status === 'confirmed_fraud')
                entry.fraud++;
            else if (t.riskScore >= 60 || t.status === 'suspicious')
                entry.suspicious++;
            catMap.set(t.category, entry);
        });
        const categoryBreakdown = Array.from(catMap.entries()).map(([category, data]) => ({
            category,
            totalCount: data.total,
            fraudCount: data.fraud,
            suspiciousCount: data.suspicious,
            totalAmount: Math.round(data.amount)
        })).sort((a, b) => b.totalAmount - a.totalAmount);
        // By Location
        const locMap = new Map();
        txs.forEach(t => {
            const entry = locMap.get(t.location) || { count: 0, fraud: 0, amount: 0 };
            entry.count++;
            entry.amount += t.amount;
            if (t.riskScore >= 60)
                entry.fraud++;
            locMap.set(t.location, entry);
        });
        const locationBreakdown = Array.from(locMap.entries()).map(([location, data]) => ({
            location,
            count: data.count,
            fraudCount: data.fraud,
            amount: Math.round(data.amount)
        })).sort((a, b) => b.count - a.count).slice(0, 10);
        // By Payment Method
        const payMap = new Map();
        txs.forEach(t => {
            const entry = payMap.get(t.paymentMethod) || { count: 0, fraud: 0, amount: 0 };
            entry.count++;
            entry.amount += t.amount;
            if (t.riskScore >= 60)
                entry.fraud++;
            payMap.set(t.paymentMethod, entry);
        });
        const paymentBreakdown = Array.from(payMap.entries()).map(([method, data]) => ({
            method,
            count: data.count,
            fraudCount: data.fraud,
            amount: Math.round(data.amount)
        })).sort((a, b) => b.count - a.count);
        // By Hour of Day (0-23)
        const hourMap = new Array(24).fill(0).map((_, h) => ({ hour: `${h}:00`, total: 0, fraud: 0 }));
        txs.forEach(t => {
            const h = new Date(t.timestamp).getHours();
            hourMap[h].total++;
            if (t.riskScore >= 60)
                hourMap[h].fraud++;
        });
        // Risk distribution
        const riskDistribution = [
            { name: 'Low (0-29)', count: txs.filter(t => t.riskLevel === 'LOW').length, color: '#10b981' },
            { name: 'Medium (30-59)', count: txs.filter(t => t.riskLevel === 'MEDIUM').length, color: '#f59e0b' },
            { name: 'High (60-79)', count: txs.filter(t => t.riskLevel === 'HIGH').length, color: '#f97316' },
            { name: 'Critical (80-100)', count: txs.filter(t => t.riskLevel === 'CRITICAL').length, color: '#ef4444' }
        ];
        res.json({
            metrics: {
                totalTransactions,
                totalTransactionValue: Math.round(totalTransactionValue),
                suspiciousCount,
                fraudCount,
                moneyAtRisk: Math.round(moneyAtRisk),
                avgRiskScore
            },
            categoryBreakdown,
            locationBreakdown,
            paymentBreakdown,
            hourDistribution: hourMap,
            riskDistribution
        });
    }
    catch (err) {
        console.error('Error fetching analytics:', err);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});
export default router;
