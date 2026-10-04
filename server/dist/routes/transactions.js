import { Router } from 'express';
import multer from 'multer';
import { db } from '../db/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { recordAuditLog } from '../middleware/audit.js';
import { FraudDetectionEngine } from '../fraud-engine/engine.js';
const router = Router();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit
// -------------------------------------------------------------
// GET /api/transactions
// -------------------------------------------------------------
router.get('/', authenticate, (req, res) => {
    try {
        const user = req.user;
        const { page, limit, search, status, riskLevel, category, minAmount, maxAmount, startDate, endDate, sortBy, sortOrder, userId } = req.query;
        // Strict role check: Normal user can ONLY see their own transactions
        const targetUserId = user.role === 'user' ? user.id : userId;
        const result = db.getTransactions({
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 15,
            search: search,
            status: status,
            riskLevel: riskLevel,
            category: category,
            minAmount: minAmount ? parseFloat(minAmount) : undefined,
            maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
            startDate: startDate,
            endDate: endDate,
            sortBy: sortBy,
            sortOrder: sortOrder || 'desc',
            userId: targetUserId
        });
        res.json(result);
    }
    catch (err) {
        console.error('Error fetching transactions:', err);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});
// -------------------------------------------------------------
// GET /api/transactions/:id
// -------------------------------------------------------------
router.get('/:id', authenticate, (req, res) => {
    try {
        const id = req.params.id;
        const tx = db.getTransactionById(id);
        if (!tx) {
            res.status(404).json({ error: 'Transaction not found' });
            return;
        }
        // Role check: Normal user can only view their own
        if (req.user.role === 'user' && tx.userId !== req.user.id) {
            res.status(403).json({ error: 'Access denied to this transaction.' });
            return;
        }
        res.json({ transaction: tx });
    }
    catch (err) {
        console.error('Error fetching transaction details:', err);
        res.status(500).json({ error: 'Failed to fetch transaction details' });
    }
});
// -------------------------------------------------------------
// POST /api/transactions (Add Transaction with Instant Analysis)
// -------------------------------------------------------------
router.post('/', authenticate, (req, res) => {
    try {
        const { amount, currency = 'INR', merchant, category, location, paymentMethod = 'credit_card', deviceId = 'DEV-MANUAL-SUBMIT', timestamp = new Date().toISOString(), userId } = req.body;
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            res.status(400).json({ error: 'A valid positive transaction amount is required.' });
            return;
        }
        if (!merchant || !category || !location) {
            res.status(400).json({ error: 'Merchant, category, and location are required.' });
            return;
        }
        // Target user
        const targetUserId = req.user.role === 'user' ? req.user.id : (userId || req.user.id);
        const targetUser = db.getUserById(targetUserId);
        const txId = `TXN-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 89)}`;
        const parsedAmount = parseFloat(amount);
        const rawTx = {
            userId: targetUserId,
            userName: targetUser?.name || 'Customer',
            userEmail: targetUser?.email || '',
            amount: parsedAmount,
            currency,
            merchant: merchant.trim(),
            category: category.trim(),
            location: location.trim(),
            paymentMethod,
            deviceId: deviceId.trim(),
            timestamp
        };
        // 1. Fetch user history and profile
        const userProfile = db.getUserBehavior(targetUserId);
        const recentTxs = db.getTransactions({ userId: targetUserId, limit: 10 }).transactions;
        const rules = db.getRules();
        // 2. Evaluate with Fraud Engine
        const evalResult = FraudDetectionEngine.evaluate(rawTx, userProfile, recentTxs, rules);
        let status = 'legitimate';
        if (evalResult.riskLevel === 'CRITICAL') {
            status = 'confirmed_fraud';
        }
        else if (evalResult.riskLevel === 'HIGH') {
            status = 'suspicious';
        }
        else if (evalResult.riskLevel === 'MEDIUM') {
            status = 'under_review';
        }
        const newTx = {
            id: txId,
            ...rawTx,
            status,
            riskScore: evalResult.riskScore,
            riskLevel: evalResult.riskLevel
        };
        const newAnalysis = {
            id: `FA-${txId}`,
            transactionId: txId,
            riskScore: evalResult.riskScore,
            riskLevel: evalResult.riskLevel,
            fraudProbability: evalResult.fraudProbability,
            explanation: evalResult.explanation,
            contributors: evalResult.contributors,
            analyzedAt: new Date().toISOString()
        };
        // 3. Save Transaction & Analysis
        db.addTransaction(newTx, newAnalysis);
        // 4. Create Alert if triggered
        let alertCreated;
        if (evalResult.alertTriggered) {
            alertCreated = {
                id: `ALT-${Date.now().toString().slice(-5)}${Math.floor(10 + Math.random() * 89)}`,
                transactionId: newTx.id,
                userId: newTx.userId,
                userName: newTx.userName,
                amount: newTx.amount,
                merchant: newTx.merchant,
                severity: evalResult.alertSeverity || 'high',
                alertType: evalResult.alertType || 'Suspicious Outlier Detected',
                reason: evalResult.explanation,
                status: 'new',
                createdAt: new Date().toISOString()
            };
            db.addAlert(alertCreated);
        }
        // 5. Audit Log
        recordAuditLog(req, 'Transaction Created', `Transaction ${txId} created for ₹${parsedAmount}. Risk Score: ${evalResult.riskScore}/100 (${evalResult.riskLevel}).`);
        res.status(201).json({
            success: true,
            transaction: {
                ...newTx,
                fraudAnalysis: newAnalysis
            },
            alert: alertCreated
        });
    }
    catch (err) {
        console.error('Error creating transaction:', err);
        res.status(500).json({ error: 'Failed to process transaction' });
    }
});
// -------------------------------------------------------------
// PATCH /api/transactions/:id/status (Investigation Status Update)
// -------------------------------------------------------------
router.patch('/:id/status', authenticate, requireRole(['admin', 'analyst']), (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        const validStatuses = ['legitimate', 'under_review', 'suspicious', 'confirmed_fraud', 'dismissed'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
            return;
        }
        const tx = db.getTransactionById(id);
        if (!tx) {
            res.status(404).json({ error: 'Transaction not found' });
            return;
        }
        const oldStatus = tx.status;
        db.updateTransactionStatus(id, status);
        recordAuditLog(req, 'Transaction Status Updated', `Transaction ${id} status changed from '${oldStatus}' to '${status}'.`);
        res.json({
            success: true,
            message: `Transaction ${id} status successfully updated to ${status}.`,
            transaction: db.getTransactionById(id)
        });
    }
    catch (err) {
        console.error('Error updating transaction status:', err);
        res.status(500).json({ error: 'Failed to update transaction status' });
    }
});
// -------------------------------------------------------------
// POST /api/transactions/upload (CSV Upload & Batch Fraud Engine Scan)
// -------------------------------------------------------------
router.post('/upload', authenticate, upload.single('file'), (req, res) => {
    try {
        let fileContent = '';
        if (req.file) {
            fileContent = req.file.buffer.toString('utf-8');
        }
        else if (req.body.csvData) {
            fileContent = req.body.csvData;
        }
        else {
            res.status(400).json({ error: 'Please upload a CSV file or provide csvData string.' });
            return;
        }
        const lines = fileContent.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
            res.status(400).json({ error: 'CSV file is empty or missing headers.' });
            return;
        }
        const headerLine = lines[0].toLowerCase();
        const headers = headerLine.split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
        const requiredHeaders = ['amount', 'merchant', 'category'];
        const missing = requiredHeaders.filter(rh => !headers.includes(rh));
        if (missing.length > 0) {
            res.status(400).json({
                error: `CSV missing required columns: ${missing.join(', ')}. Expected at least: transaction_id, user_id, timestamp, amount, currency, merchant, category, location, payment_method, device_id.`
            });
            return;
        }
        const getIdx = (name) => headers.findIndex(h => h === name || h.includes(name));
        const idIdx = getIdx('id');
        const userIdx = getIdx('user');
        const timeIdx = getIdx('timestamp') !== -1 ? getIdx('timestamp') : getIdx('date');
        const amountIdx = getIdx('amount');
        const currIdx = getIdx('currency');
        const merchIdx = getIdx('merchant');
        const catIdx = getIdx('category');
        const locIdx = getIdx('location');
        const payIdx = getIdx('payment');
        const devIdx = getIdx('device');
        const totalRows = lines.length - 1;
        let validRows = 0;
        let invalidRows = 0;
        const errors = [];
        const validTransactions = [];
        const defaultUser = req.user;
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line)
                continue;
            const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
            const amountVal = parseFloat(cols[amountIdx]);
            if (isNaN(amountVal) || amountVal <= 0) {
                invalidRows++;
                errors.push({ row: i, error: `Invalid amount value: "${cols[amountIdx]}"` });
                continue;
            }
            const merchantVal = merchIdx !== -1 && cols[merchIdx] ? cols[merchIdx] : '';
            if (!merchantVal) {
                invalidRows++;
                errors.push({ row: i, error: 'Merchant is empty' });
                continue;
            }
            const categoryVal = catIdx !== -1 && cols[catIdx] ? cols[catIdx] : 'Other';
            const locationVal = locIdx !== -1 && cols[locIdx] ? cols[locIdx] : 'Mumbai';
            const currencyVal = currIdx !== -1 && cols[currIdx] ? cols[currIdx] : 'INR';
            const paymentVal = payIdx !== -1 && cols[payIdx] ? cols[payIdx] : 'credit_card';
            const deviceVal = devIdx !== -1 && cols[devIdx] ? cols[devIdx] : 'DEV-CSV-IMPORT';
            const timeVal = timeIdx !== -1 && cols[timeIdx] ? cols[timeIdx] : new Date().toISOString();
            const customId = idIdx !== -1 && cols[idIdx] ? cols[idIdx] : `TXN-CSV-${Date.now().toString().slice(-4)}-${i}`;
            let rowUserId = (userIdx !== -1 && cols[userIdx]) ? cols[userIdx] : defaultUser.id;
            // If regular user, always enforce their own user ID
            if (defaultUser.role === 'user') {
                rowUserId = defaultUser.id;
            }
            validRows++;
            validTransactions.push({
                id: customId,
                userId: rowUserId,
                userName: defaultUser.name,
                userEmail: defaultUser.email,
                amount: amountVal,
                currency: currencyVal,
                merchant: merchantVal,
                category: categoryVal,
                location: locationVal,
                paymentMethod: paymentVal,
                deviceId: deviceVal,
                timestamp: timeVal
            });
        }
        // Process valid transactions through Fraud Engine
        let suspiciousCount = 0;
        let fraudCount = 0;
        const rules = db.getRules();
        for (const rawTx of validTransactions) {
            const userProfile = db.getUserBehavior(rawTx.userId);
            const recentTxs = db.getTransactions({ userId: rawTx.userId, limit: 10 }).transactions;
            const evalResult = FraudDetectionEngine.evaluate(rawTx, userProfile, recentTxs, rules);
            let status = 'legitimate';
            if (evalResult.riskLevel === 'CRITICAL') {
                status = 'confirmed_fraud';
                fraudCount++;
            }
            else if (evalResult.riskLevel === 'HIGH') {
                status = 'suspicious';
                suspiciousCount++;
            }
            else if (evalResult.riskLevel === 'MEDIUM') {
                status = 'under_review';
            }
            const tx = {
                ...rawTx,
                status,
                riskScore: evalResult.riskScore,
                riskLevel: evalResult.riskLevel
            };
            const analysis = {
                id: `FA-${tx.id}`,
                transactionId: tx.id,
                riskScore: evalResult.riskScore,
                riskLevel: evalResult.riskLevel,
                fraudProbability: evalResult.fraudProbability,
                explanation: evalResult.explanation,
                contributors: evalResult.contributors,
                analyzedAt: new Date().toISOString()
            };
            db.addTransaction(tx, analysis);
            if (evalResult.alertTriggered) {
                db.addAlert({
                    id: `ALT-CSV-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 89)}`,
                    transactionId: tx.id,
                    userId: tx.userId,
                    userName: tx.userName,
                    amount: tx.amount,
                    merchant: tx.merchant,
                    severity: evalResult.alertSeverity || 'high',
                    alertType: evalResult.alertType || 'CSV Batch Outlier Detection',
                    reason: evalResult.explanation,
                    status: 'new',
                    createdAt: new Date().toISOString()
                });
            }
        }
        recordAuditLog(req, 'CSV Upload & Batch Scan', `Imported ${validRows} transactions from CSV. Detected ${suspiciousCount} suspicious and ${fraudCount} critical fraud instances.`);
        res.json({
            success: true,
            totalRows,
            validRows,
            invalidRows,
            importedRows: validRows,
            suspiciousDetected: suspiciousCount,
            fraudDetected: fraudCount,
            errors: errors.slice(0, 5) // Return top 5 errors if any
        });
    }
    catch (err) {
        console.error('Error processing CSV upload:', err);
        res.status(500).json({ error: 'Failed to process CSV upload' });
    }
});
export default router;
