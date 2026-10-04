import { Router } from 'express';
import { db } from '../db/db.js';
import { authenticate } from '../middleware/auth.js';
import { recordAuditLog } from '../middleware/audit.js';
import { FraudDetectionEngine } from '../fraud-engine/engine.js';
const router = Router();
// -------------------------------------------------------------
// POST /api/simulation/normal
// -------------------------------------------------------------
router.post('/normal', authenticate, (req, res) => {
    try {
        const user = req.user;
        const userProfile = db.getUserBehavior(user.id);
        const recentTxs = db.getTransactions({ userId: user.id, limit: 10 }).transactions;
        const rules = db.getRules();
        const normalMerchants = [
            { name: 'Swiggy Food Express', category: 'Food', amount: 480 },
            { name: 'Amazon India Essentials', category: 'Shopping', amount: 1650 },
            { name: 'Starbucks Reserve', category: 'Food', amount: 620 },
            { name: 'Airtel Broadband Fiber', category: 'Bills', amount: 999 },
            { name: 'BookMyShow Cinema', category: 'Entertainment', amount: 750 }
        ];
        const pick = normalMerchants[Math.floor(Math.random() * normalMerchants.length)];
        const homeCity = userProfile?.frequentLocations[0] || 'Mumbai';
        const primaryDevice = userProfile?.knownDevices[0] || 'DEV-IPHONE-15-KALP';
        const txId = `TXN-SIM-NORM-${Date.now().toString().slice(-5)}`;
        const rawTx = {
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            amount: pick.amount,
            currency: 'INR',
            merchant: pick.name,
            category: pick.category,
            location: homeCity,
            paymentMethod: 'upi',
            deviceId: primaryDevice,
            timestamp: new Date().toISOString()
        };
        const evalResult = FraudDetectionEngine.evaluate(rawTx, userProfile, recentTxs, rules);
        const tx = {
            id: txId,
            ...rawTx,
            status: evalResult.riskLevel === 'LOW' ? 'legitimate' : 'under_review',
            riskScore: evalResult.riskScore,
            riskLevel: evalResult.riskLevel
        };
        const analysis = {
            id: `FA-${txId}`,
            transactionId: txId,
            riskScore: evalResult.riskScore,
            riskLevel: evalResult.riskLevel,
            fraudProbability: evalResult.fraudProbability,
            explanation: evalResult.explanation,
            contributors: evalResult.contributors,
            analyzedAt: new Date().toISOString()
        };
        db.addTransaction(tx, analysis);
        recordAuditLog(req, 'Live Simulation: Normal Transaction', `Simulated routine transaction ${txId} for ₹${tx.amount} at ${tx.merchant}. Risk Score: ${evalResult.riskScore}/100.`);
        res.json({
            success: true,
            transaction: {
                ...tx,
                fraudAnalysis: analysis
            },
            message: 'Normal transaction generated and verified by FinShield fraud engine.'
        });
    }
    catch (err) {
        console.error('Simulation error:', err);
        res.status(500).json({ error: 'Failed to simulate normal transaction' });
    }
});
// -------------------------------------------------------------
// POST /api/simulation/suspicious
// -------------------------------------------------------------
router.post('/suspicious', authenticate, (req, res) => {
    try {
        const user = req.user;
        const userProfile = db.getUserBehavior(user.id);
        const rules = db.getRules();
        // Create 2 rapid precursor transactions to trigger velocity burst anomaly
        const baseTime = new Date();
        const burst1Id = `TXN-BURST-${Date.now().toString().slice(-5)}-1`;
        const burst2Id = `TXN-BURST-${Date.now().toString().slice(-5)}-2`;
        const burst1 = {
            id: burst1Id,
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            amount: 14500,
            currency: 'INR',
            merchant: 'QuickCheckout Online',
            category: 'Shopping',
            location: 'New Delhi',
            paymentMethod: 'credit_card',
            deviceId: 'DEV-UNKNOWN-TOR-77',
            timestamp: new Date(baseTime.getTime() - 2 * 60 * 1000).toISOString(),
            status: 'under_review',
            riskScore: 45,
            riskLevel: 'MEDIUM'
        };
        const burst2 = {
            id: burst2Id,
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            amount: 22000,
            currency: 'INR',
            merchant: 'Digital Voucher Hub',
            category: 'Shopping',
            location: 'New Delhi',
            paymentMethod: 'credit_card',
            deviceId: 'DEV-UNKNOWN-TOR-77',
            timestamp: new Date(baseTime.getTime() - 1 * 60 * 1000).toISOString(),
            status: 'suspicious',
            riskScore: 58,
            riskLevel: 'MEDIUM'
        };
        // Add bursts to DB
        db.addTransaction(burst1, {
            id: `FA-${burst1Id}`,
            transactionId: burst1Id,
            riskScore: 45,
            riskLevel: 'MEDIUM',
            fraudProbability: 42,
            explanation: 'Rapid successive checkout from unfamiliar IP range.',
            contributors: [],
            analyzedAt: burst1.timestamp
        });
        db.addTransaction(burst2, {
            id: `FA-${burst2Id}`,
            transactionId: burst2Id,
            riskScore: 58,
            riskLevel: 'MEDIUM',
            fraudProbability: 55,
            explanation: 'Repeated transaction within 60 seconds.',
            contributors: [],
            analyzedAt: burst2.timestamp
        });
        // The primary critical transaction:
        // Amount: ₹85,000 | Location: New Delhi | Time: 2:47 AM | Device: Unknown (DEV-UNKNOWN-TOR-77) | High Risk Category
        const suspTime = new Date();
        suspTime.setHours(2, 47, 15); // 2:47 AM
        const txId = `TXN-SIM-SUSP-${Date.now().toString().slice(-5)}`;
        const rawTx = {
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            amount: 85000,
            currency: 'INR',
            merchant: 'Apex Global Crypto OTC',
            category: 'Crypto Exchange',
            location: 'New Delhi',
            paymentMethod: 'wire_transfer',
            deviceId: 'DEV-UNKNOWN-TOR-77',
            timestamp: suspTime.toISOString()
        };
        // Recent transactions include the bursts we just inserted
        const recentTxs = [burst2, burst1, ...db.getTransactions({ userId: user.id, limit: 8 }).transactions];
        // Evaluate through the transparent weighted fraud engine
        const evalResult = FraudDetectionEngine.evaluate(rawTx, userProfile, recentTxs, rules);
        const tx = {
            id: txId,
            ...rawTx,
            status: evalResult.riskLevel === 'CRITICAL' ? 'confirmed_fraud' : 'suspicious',
            riskScore: evalResult.riskScore,
            riskLevel: evalResult.riskLevel
        };
        const analysis = {
            id: `FA-${txId}`,
            transactionId: txId,
            riskScore: evalResult.riskScore,
            riskLevel: evalResult.riskLevel,
            fraudProbability: evalResult.fraudProbability,
            explanation: evalResult.explanation,
            contributors: evalResult.contributors,
            analyzedAt: new Date().toISOString()
        };
        db.addTransaction(tx, analysis);
        // Auto-create alert
        const alert = {
            id: `ALT-SIM-${Date.now().toString().slice(-5)}`,
            transactionId: tx.id,
            userId: tx.userId,
            userName: tx.userName,
            amount: tx.amount,
            merchant: tx.merchant,
            severity: evalResult.riskScore >= 80 ? 'critical' : 'high',
            alertType: 'Simulated High-Threat Financial Intrusion',
            reason: evalResult.explanation,
            status: 'new',
            createdAt: new Date().toISOString()
        };
        db.addAlert(alert);
        recordAuditLog(req, 'Live Simulation: Suspicious Fraud Attack', `Simulated critical fraud intrusion ${txId} for ₹${tx.amount} at ${tx.merchant}. Calculated Risk Score: ${evalResult.riskScore}/100 (${evalResult.riskLevel}). Alert ${alert.id} generated.`);
        res.json({
            success: true,
            transaction: {
                ...tx,
                fraudAnalysis: analysis
            },
            alert,
            message: `Suspicious transaction simulated! Dynamic risk score calculated: ${evalResult.riskScore}/100 (${evalResult.riskLevel}).`
        });
    }
    catch (err) {
        console.error('Simulation error:', err);
        res.status(500).json({ error: 'Failed to simulate suspicious transaction' });
    }
});
export default router;
