import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { initialDatabaseState } from './initialData.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function getDbFilePath() {
    const candidates = [
        path.resolve(__dirname, '../data/finshield_db.json'),
        path.resolve(__dirname, '../../data/finshield_db.json'),
        path.resolve(process.cwd(), 'server/data/finshield_db.json'),
        path.resolve(process.cwd(), 'server/dist/data/finshield_db.json'),
        path.resolve(process.cwd(), 'data/finshield_db.json'),
        path.resolve(process.cwd(), 'dist/data/finshield_db.json'),
        path.resolve(__dirname, '../../../server/data/finshield_db.json'),
        path.join(os.tmpdir(), 'finshield_db.json')
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return { dataDir: path.dirname(candidate), dbFile: candidate };
        }
    }
    const defaultDir = path.resolve(process.cwd(), 'server/data');
    return { dataDir: defaultDir, dbFile: path.join(defaultDir, 'finshield_db.json') };
}
const { dataDir: DATA_DIR, dbFile: DB_FILE } = getDbFilePath();
export const DEFAULT_RULES = {
    highValueThreshold: 50000,
    velocityWindowMinutes: 10,
    velocityCountThreshold: 3,
    unusualHoursStart: 1, // 1:00 AM
    unusualHoursEnd: 5, // 5:00 AM
    highRiskMerchantCategories: [
        'Crypto Exchange',
        'Online Gambling',
        'Unregulated Remittance',
        'Offshore Casino',
        'High-Value Electronics',
        'Precious Metals Trading'
    ],
    weights: {
        amountAnomaly: 20,
        frequencyAnomaly: 20,
        locationAnomaly: 15,
        timeAnomaly: 10,
        merchantRisk: 15,
        deviceAnomaly: 10,
        behavioralAnomaly: 10,
    }
};
class DatabaseService {
    state = initialDatabaseState || {
        users: [],
        transactions: [],
        fraudAnalysis: {},
        fraudAlerts: [],
        merchants: [],
        fraudRules: DEFAULT_RULES,
        userBehavior: {},
        auditLogs: [],
        reports: []
    };
    isLoaded = true;
    saveTimeout = null;
    constructor() {
        this.init();
    }
    init() {
        try {
            const candidates = [
                path.join(os.tmpdir(), 'finshield_db.json'),
                DB_FILE,
                path.resolve(__dirname, '../data/finshield_db.json'),
                path.resolve(__dirname, '../../data/finshield_db.json'),
                path.resolve(process.cwd(), 'server/data/finshield_db.json'),
                path.resolve(process.cwd(), 'server/dist/data/finshield_db.json'),
                path.resolve(process.cwd(), 'data/finshield_db.json'),
                path.resolve(process.cwd(), 'dist/data/finshield_db.json')
            ];
            for (const p of candidates) {
                if (fs.existsSync(p)) {
                    const raw = fs.readFileSync(p, 'utf-8');
                    const parsed = JSON.parse(raw);
                    if (parsed && Array.isArray(parsed.transactions) && parsed.transactions.length > 0) {
                        this.state = parsed;
                        if (!this.state.fraudRules) {
                            this.state.fraudRules = DEFAULT_RULES;
                        }
                        this.isLoaded = true;
                        return;
                    }
                }
            }
        }
        catch (err) {
            console.error('Failed reading database file, using bundled state', err);
        }
    }
    saveSync() {
        try {
            try {
                if (!fs.existsSync(DATA_DIR)) {
                    fs.mkdirSync(DATA_DIR, { recursive: true });
                }
            }
            catch {
                // Read-only filesystem on Vercel
            }
            fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
        }
        catch (err) {
            try {
                const tmpFile = path.join(os.tmpdir(), 'finshield_db.json');
                fs.writeFileSync(tmpFile, JSON.stringify(this.state, null, 2), 'utf-8');
            }
            catch {
                // State remains in memory safely
            }
        }
    }
    queueSave() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        this.saveTimeout = setTimeout(() => {
            this.saveSync();
        }, 200);
    }
    getState() {
        return this.state;
    }
    isSeeded() {
        return this.state.transactions.length >= 100 && this.state.users.length >= 3;
    }
    // ================= USERS =================
    getUsers() {
        return this.state.users.map(u => ({
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
            status: u.status,
            createdAt: u.createdAt,
            transactionCount: this.state.transactions.filter(t => t.userId === u.id).length,
            riskLevel: this.calculateUserRiskLevel(u.id)
        }));
    }
    getUserById(id) {
        return this.state.users.find(u => u.id === id);
    }
    getUserByEmail(email) {
        return this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    }
    addUser(user) {
        this.state.users.push(user);
        this.queueSave();
    }
    updateUserRole(userId, role) {
        const user = this.state.users.find(u => u.id === userId);
        if (user) {
            user.role = role;
            this.queueSave();
        }
    }
    updateUserStatus(userId, status) {
        const user = this.state.users.find(u => u.id === userId);
        if (user) {
            user.status = status;
            this.queueSave();
        }
    }
    calculateUserRiskLevel(userId) {
        const userTxs = this.state.transactions.filter(t => t.userId === userId);
        if (userTxs.length === 0)
            return 'LOW';
        const fraudOrSuspicious = userTxs.filter(t => t.status === 'suspicious' || t.status === 'confirmed_fraud');
        const ratio = fraudOrSuspicious.length / userTxs.length;
        if (ratio > 0.3)
            return 'CRITICAL';
        if (ratio > 0.15)
            return 'HIGH';
        if (ratio > 0.05)
            return 'MEDIUM';
        return 'LOW';
    }
    // ================= FRAUD RULES =================
    getRules() {
        return this.state.fraudRules || DEFAULT_RULES;
    }
    updateRules(rules) {
        this.state.fraudRules = rules;
        this.queueSave();
    }
    // ================= USER BEHAVIOR =================
    getUserBehavior(userId) {
        return this.state.userBehavior[userId] || null;
    }
    setUserBehavior(userId, profile) {
        this.state.userBehavior[userId] = profile;
        this.queueSave();
    }
    refreshUserBehavior(userId) {
        const txs = this.state.transactions.filter(t => t.userId === userId && t.status !== 'confirmed_fraud');
        if (txs.length === 0)
            return;
        const total = txs.reduce((acc, curr) => acc + curr.amount, 0);
        const avg = total / txs.length;
        const max = Math.max(...txs.map(t => t.amount));
        const locationMap = new Map();
        const deviceMap = new Map();
        const categoryMap = new Map();
        txs.forEach(t => {
            locationMap.set(t.location, (locationMap.get(t.location) || 0) + 1);
            deviceMap.set(t.deviceId, (deviceMap.get(t.deviceId) || 0) + 1);
            categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + 1);
        });
        const frequentLocations = Array.from(locationMap.entries())
            .sort((a, b) => b[1] - a[1])
            .map(e => e[0]);
        const knownDevices = Array.from(deviceMap.entries())
            .sort((a, b) => b[1] - a[1])
            .map(e => e[0]);
        const commonCategories = Array.from(categoryMap.entries())
            .sort((a, b) => b[1] - a[1])
            .map(e => e[0]);
        const lastTx = txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        this.state.userBehavior[userId] = {
            userId,
            avgAmount: Math.round(avg),
            maxAmount: max,
            frequentLocations: frequentLocations.slice(0, 5),
            knownDevices: knownDevices.slice(0, 5),
            commonCategories: commonCategories.slice(0, 8),
            totalTransactions: txs.length,
            lastTransactionTimestamp: lastTx?.timestamp
        };
        this.queueSave();
    }
    // ================= TRANSACTIONS =================
    getTransactions(params) {
        let filtered = [...this.state.transactions];
        if (params.userId) {
            filtered = filtered.filter(t => t.userId === params.userId);
        }
        if (params.status && params.status !== 'all') {
            filtered = filtered.filter(t => t.status === params.status);
        }
        if (params.riskLevel && params.riskLevel !== 'all') {
            filtered = filtered.filter(t => t.riskLevel.toUpperCase() === params.riskLevel?.toUpperCase());
        }
        if (params.category && params.category !== 'all') {
            filtered = filtered.filter(t => t.category.toLowerCase() === params.category?.toLowerCase());
        }
        if (params.minAmount !== undefined && !isNaN(params.minAmount)) {
            filtered = filtered.filter(t => t.amount >= (params.minAmount || 0));
        }
        if (params.maxAmount !== undefined && !isNaN(params.maxAmount)) {
            filtered = filtered.filter(t => t.amount <= (params.maxAmount || 0));
        }
        if (params.startDate) {
            filtered = filtered.filter(t => new Date(t.timestamp) >= new Date(params.startDate));
        }
        if (params.endDate) {
            filtered = filtered.filter(t => new Date(t.timestamp) <= new Date(params.endDate));
        }
        if (params.search) {
            const q = params.search.toLowerCase();
            filtered = filtered.filter(t => t.id.toLowerCase().includes(q) ||
                t.merchant.toLowerCase().includes(q) ||
                t.location.toLowerCase().includes(q) ||
                (t.userName && t.userName.toLowerCase().includes(q)) ||
                (t.userEmail && t.userEmail.toLowerCase().includes(q)));
        }
        // Sorting
        const sortBy = params.sortBy || 'timestamp';
        const sortOrder = params.sortOrder || 'desc';
        filtered.sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'amount') {
                comparison = a.amount - b.amount;
            }
            else if (sortBy === 'riskScore') {
                comparison = a.riskScore - b.riskScore;
            }
            else if (sortBy === 'timestamp') {
                comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            }
            else {
                comparison = String(a[sortBy] || '').localeCompare(String(b[sortBy] || ''));
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });
        const total = filtered.length;
        const page = Math.max(1, params.page || 1);
        const limit = Math.max(1, params.limit || 15);
        const startIndex = (page - 1) * limit;
        const paginated = filtered.slice(startIndex, startIndex + limit);
        // Attach fraudAnalysis
        const enriched = paginated.map(t => ({
            ...t,
            fraudAnalysis: this.state.fraudAnalysis[t.id]
        }));
        return {
            transactions: enriched,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            limit
        };
    }
    getTransactionById(id) {
        const tx = this.state.transactions.find(t => t.id === id);
        if (!tx)
            return null;
        return {
            ...tx,
            fraudAnalysis: this.state.fraudAnalysis[tx.id]
        };
    }
    addTransaction(tx, analysis) {
        this.state.transactions.unshift(tx);
        this.state.fraudAnalysis[tx.id] = analysis;
        this.refreshUserBehavior(tx.userId);
        this.queueSave();
    }
    updateTransactionStatus(id, status) {
        const tx = this.state.transactions.find(t => t.id === id);
        if (tx) {
            tx.status = status;
            this.queueSave();
        }
    }
    // ================= ALERTS =================
    getAlerts(params) {
        let filtered = [...this.state.fraudAlerts];
        if (params.userId) {
            filtered = filtered.filter(a => a.userId === params.userId);
        }
        if (params.status && params.status !== 'all') {
            filtered = filtered.filter(a => a.status === params.status);
        }
        if (params.severity && params.severity !== 'all') {
            filtered = filtered.filter(a => a.severity.toLowerCase() === params.severity?.toLowerCase());
        }
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const total = filtered.length;
        const page = Math.max(1, params.page || 1);
        const limit = Math.max(1, params.limit || 15);
        const startIndex = (page - 1) * limit;
        const paginated = filtered.slice(startIndex, startIndex + limit);
        return {
            alerts: paginated,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            limit
        };
    }
    addAlert(alert) {
        this.state.fraudAlerts.unshift(alert);
        this.queueSave();
    }
    updateAlertStatus(id, status, resolvedBy) {
        const alert = this.state.fraudAlerts.find(a => a.id === id);
        if (alert) {
            alert.status = status;
            if (status === 'resolved' || status === 'dismissed') {
                alert.resolvedAt = new Date().toISOString();
                alert.resolvedBy = resolvedBy;
            }
            this.queueSave();
        }
    }
    // ================= AUDIT LOGS =================
    addAuditLog(log) {
        this.state.auditLogs.unshift(log);
        // Keep max 500 logs
        if (this.state.auditLogs.length > 500) {
            this.state.auditLogs = this.state.auditLogs.slice(0, 500);
        }
        this.queueSave();
    }
    getAuditLogs(params) {
        let filtered = [...this.state.auditLogs];
        if (params.search) {
            const q = params.search.toLowerCase();
            filtered = filtered.filter(l => l.action.toLowerCase().includes(q) ||
                l.userName.toLowerCase().includes(q) ||
                l.details.toLowerCase().includes(q));
        }
        filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const total = filtered.length;
        const page = Math.max(1, params.page || 1);
        const limit = Math.max(1, params.limit || 20);
        const startIndex = (page - 1) * limit;
        return {
            logs: filtered.slice(startIndex, startIndex + limit),
            total,
            page,
            totalPages: Math.ceil(total / limit),
            limit
        };
    }
    // ================= REPORTS =================
    addReport(report) {
        this.state.reports.unshift(report);
        this.queueSave();
    }
    getReports() {
        return this.state.reports;
    }
    // ================= DASHBOARD METRICS =================
    calculateDashboardMetrics() {
        const txs = this.state.transactions;
        const totalTransactions = txs.length;
        const totalTransactionValue = txs.reduce((acc, t) => acc + t.amount, 0);
        const suspiciousTransactions = txs.filter(t => t.status === 'suspicious' || t.riskLevel === 'HIGH').length;
        const confirmedFraud = txs.filter(t => t.status === 'confirmed_fraud' || t.riskLevel === 'CRITICAL').length;
        const averageRiskScore = totalTransactions > 0
            ? Math.round(txs.reduce((acc, t) => acc + t.riskScore, 0) / totalTransactions)
            : 0;
        // Money at risk: sum of amounts for HIGH, CRITICAL, suspicious, or confirmed_fraud
        const moneyAtRisk = txs
            .filter(t => t.status === 'suspicious' || t.status === 'confirmed_fraud' || t.riskScore >= 60)
            .reduce((acc, t) => acc + t.amount, 0);
        // Risk distribution
        const riskDistribution = {
            low: txs.filter(t => t.riskLevel === 'LOW').length,
            medium: txs.filter(t => t.riskLevel === 'MEDIUM').length,
            high: txs.filter(t => t.riskLevel === 'HIGH').length,
            critical: txs.filter(t => t.riskLevel === 'CRITICAL').length
        };
        // Fraud vs Legit
        const legitCount = txs.filter(t => t.status === 'legitimate' && t.riskScore < 30).length;
        const legitValue = txs.filter(t => t.status === 'legitimate' && t.riskScore < 30).reduce((acc, t) => acc + t.amount, 0);
        const reviewCount = txs.filter(t => t.status === 'under_review' || (t.riskScore >= 30 && t.riskScore < 60)).length;
        const reviewValue = txs.filter(t => t.status === 'under_review' || (t.riskScore >= 30 && t.riskScore < 60)).reduce((acc, t) => acc + t.amount, 0);
        const fraudCount = txs.filter(t => t.status === 'suspicious' || t.status === 'confirmed_fraud' || t.riskScore >= 60).length;
        const fraudValue = txs.filter(t => t.status === 'suspicious' || t.status === 'confirmed_fraud' || t.riskScore >= 60).reduce((acc, t) => acc + t.amount, 0);
        const fraudVsLegit = [
            { name: 'Legitimate', count: legitCount, value: legitValue },
            { name: 'Under Review', count: reviewCount, value: reviewValue },
            { name: 'High Risk / Fraud', count: fraudCount, value: fraudValue }
        ];
        // Timeline aggregations (group by day for last 14 days)
        const timelineMap = new Map();
        // Sort transactions by time
        const sortedTxs = [...txs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        sortedTxs.forEach(t => {
            const dateKey = new Date(t.timestamp).toISOString().split('T')[0];
            const entry = timelineMap.get(dateKey) || { volume: 0, value: 0, suspicious: 0, fraud: 0 };
            entry.volume += 1;
            entry.value += t.amount;
            if (t.riskScore >= 60 && t.riskScore < 80)
                entry.suspicious += 1;
            if (t.riskScore >= 80 || t.status === 'confirmed_fraud')
                entry.fraud += 1;
            timelineMap.set(dateKey, entry);
        });
        const sortedDates = Array.from(timelineMap.keys()).sort();
        const recentDates = sortedDates.slice(-14);
        const transactionVolumeTimeline = recentDates.map(date => {
            const data = timelineMap.get(date);
            return {
                date,
                volume: data.volume,
                value: Math.round(data.value)
            };
        });
        const fraudTrend = recentDates.map(date => {
            const data = timelineMap.get(date);
            return {
                date,
                suspicious: data.suspicious,
                fraud: data.fraud
            };
        });
        // Fraud Categories
        const fraudCategoryMap = new Map();
        txs.filter(t => t.riskScore >= 60).forEach(t => {
            fraudCategoryMap.set(t.category, (fraudCategoryMap.get(t.category) || 0) + 1);
        });
        const fraudCategories = Array.from(fraudCategoryMap.entries())
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);
        // Recent Suspicious Transactions
        const recentSuspiciousTransactions = txs
            .filter(t => t.riskScore >= 60 || t.status === 'suspicious' || t.status === 'confirmed_fraud')
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 6)
            .map(t => ({
            ...t,
            fraudAnalysis: this.state.fraudAnalysis[t.id]
        }));
        return {
            totalTransactions,
            totalTransactionValue: Math.round(totalTransactionValue),
            suspiciousTransactions,
            confirmedFraud,
            averageRiskScore,
            moneyAtRisk: Math.round(moneyAtRisk),
            riskDistribution,
            transactionVolumeTimeline,
            fraudVsLegit,
            fraudTrend,
            fraudCategories,
            recentSuspiciousTransactions
        };
    }
    // ================= PERSONAL FINANCE =================
    calculatePersonalFinance(userId) {
        const userTxs = this.state.transactions.filter(t => t.userId === userId);
        const totalSpending = userTxs.reduce((acc, t) => acc + t.amount, 0);
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const thisMonthTxs = userTxs.filter(t => {
            const d = new Date(t.timestamp);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
        const lastMonthTxs = userTxs.filter(t => {
            const d = new Date(t.timestamp);
            const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
        });
        const monthlySpending = thisMonthTxs.reduce((acc, t) => acc + t.amount, 0);
        const lastMonthSpending = lastMonthTxs.reduce((acc, t) => acc + t.amount, 0);
        const averageTransaction = userTxs.length > 0 ? Math.round(totalSpending / userTxs.length) : 0;
        const largestTransaction = userTxs.length > 0 ? Math.max(...userTxs.map(t => t.amount)) : 0;
        // Spending by category
        const catMap = new Map();
        userTxs.forEach(t => {
            const existing = catMap.get(t.category) || { amount: 0, count: 0 };
            existing.amount += t.amount;
            existing.count += 1;
            catMap.set(t.category, existing);
        });
        const spendingByCategory = Array.from(catMap.entries()).map(([category, val]) => ({
            category,
            amount: Math.round(val.amount),
            count: val.count,
            percentage: totalSpending > 0 ? Math.round((val.amount / totalSpending) * 100) : 0
        })).sort((a, b) => b.amount - a.amount);
        // Monthly Trend (last 6 months)
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlySpendingTrend = [];
        for (let i = 5; i >= 0; i--) {
            const targetDate = new Date(currentYear, currentMonth - i, 1);
            const m = targetDate.getMonth();
            const y = targetDate.getFullYear();
            const monthTx = userTxs.filter(t => {
                const d = new Date(t.timestamp);
                return d.getMonth() === m && d.getFullYear() === y;
            });
            monthlySpendingTrend.push({
                month: `${monthNames[m]} ${y.toString().slice(-2)}`,
                amount: Math.round(monthTx.reduce((acc, t) => acc + t.amount, 0))
            });
        }
        // Weekly Trend (last 4 weeks)
        const weeklySpendingTrend = [];
        for (let w = 3; w >= 0; w--) {
            const startDay = new Date();
            startDay.setDate(startDay.getDate() - (w * 7 + 7));
            const endDay = new Date();
            endDay.setDate(endDay.getDate() - (w * 7));
            const weekTx = userTxs.filter(t => {
                const d = new Date(t.timestamp);
                return d >= startDay && d <= endDay;
            });
            weeklySpendingTrend.push({
                week: `Week ${4 - w}`,
                amount: Math.round(weekTx.reduce((acc, t) => acc + t.amount, 0))
            });
        }
        // Recent user transactions
        const recentTransactions = [...userTxs]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10)
            .map(t => ({
            ...t,
            fraudAnalysis: this.state.fraudAnalysis[t.id]
        }));
        // Personal Alerts
        const personalAlerts = this.state.fraudAlerts
            .filter(a => a.userId === userId)
            .slice(0, 5);
        // AI Insights generated dynamically from real data
        const aiInsights = [];
        if (lastMonthSpending > 0 && monthlySpending > 0) {
            const diffPercent = Math.round(((monthlySpending - lastMonthSpending) / lastMonthSpending) * 100);
            if (diffPercent > 0) {
                aiInsights.push(`Your spending increased by ${diffPercent}% compared to last month.`);
            }
            else {
                aiInsights.push(`Your spending decreased by ${Math.abs(diffPercent)}% compared to last month. Great budget control!`);
            }
        }
        else {
            aiInsights.push(`Current month expenditure stands at ₹${monthlySpending.toLocaleString()}.`);
        }
        if (spendingByCategory.length > 0) {
            const topCat = spendingByCategory[0];
            aiInsights.push(`${topCat.category} represents your largest expenditure, accounting for ${topCat.percentage}% of your total outflow.`);
        }
        const highRiskTxs = userTxs.filter(t => t.riskScore >= 60);
        if (highRiskTxs.length > 0) {
            aiInsights.push(`Security alert: ${highRiskTxs.length} transaction${highRiskTxs.length > 1 ? 's were' : ' was'} flagged with elevated risk patterns.`);
        }
        else {
            aiInsights.push(`All your recent transactions conform to your established security profile.`);
        }
        const abnormalAmounts = userTxs.filter(t => t.amount > averageTransaction * 2.5);
        if (abnormalAmounts.length > 0) {
            aiInsights.push(`${abnormalAmounts.length} transactions exceeded your typical spend baseline by more than 2.5x.`);
        }
        return {
            totalSpending: Math.round(totalSpending),
            monthlySpending: Math.round(monthlySpending),
            averageTransaction,
            largestTransaction,
            spendingByCategory,
            monthlySpendingTrend,
            weeklySpendingTrend,
            recentTransactions,
            personalAlerts,
            aiInsights
        };
    }
}
export const db = new DatabaseService();
