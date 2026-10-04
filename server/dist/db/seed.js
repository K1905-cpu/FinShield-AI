import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db, DEFAULT_RULES } from './db.js';
import { FraudDetectionEngine } from '../fraud-engine/engine.js';
const DEMO_USERS = [
    {
        id: 'usr_admin_001',
        name: 'Chief Risk Officer (Admin)',
        email: 'admin@finshield.ai',
        password: 'Admin@123',
        role: 'admin',
        status: 'active',
    },
    {
        id: 'usr_analyst_001',
        name: 'Sarah Chen (Senior Fraud Analyst)',
        email: 'analyst@finshield.ai',
        password: 'Analyst@123',
        role: 'analyst',
        status: 'active',
    },
    {
        id: 'usr_user_001',
        name: 'Kalp Shah (Retail Cardholder)',
        email: 'user@finshield.ai',
        password: 'User@123',
        role: 'user',
        status: 'active',
    },
    {
        id: 'usr_user_002',
        name: 'Vikram Sharma',
        email: 'vikram.sharma@example.com',
        password: 'User@123',
        role: 'user',
        status: 'active',
    },
    {
        id: 'usr_user_003',
        name: 'Priya Patel',
        email: 'priya.patel@example.com',
        password: 'User@123',
        role: 'user',
        status: 'active',
    },
    {
        id: 'usr_user_004',
        name: 'Rohan Mehta',
        email: 'rohan.mehta@example.com',
        password: 'User@123',
        role: 'user',
        status: 'active',
    },
    {
        id: 'usr_user_005',
        name: 'Ananya Gupta',
        email: 'ananya.gupta@example.com',
        password: 'User@123',
        role: 'user',
        status: 'active',
    }
];
const MERCHANTS_BY_CATEGORY = {
    'Food': ['Swiggy Express', 'Zomato Daily', 'Starbucks Coffee', 'Domino\'s Pizza', 'Haldiram\'s Sweets', 'Blinkit Groceries'],
    'Shopping': ['Amazon India', 'Flipkart Retail', 'Myntra Fashion', 'Zara Retail', 'Apple Store Mumbai', 'Croma Electronics'],
    'Travel': ['MakeMyTrip Flights', 'Uber Premier', 'Ola Cabs', 'IndiGo Airlines', 'IRCTC Rail Booking', 'Taj Hotels'],
    'Bills': ['Airtel Broadband', 'Tata Power Electricity', 'Adani Gas Utility', 'Jio Fiber', 'Municipal Water Tax'],
    'Entertainment': ['Netflix India', 'BookMyShow Movies', 'Spotify Premium', 'Disney+ Hotstar', 'PVR Inox Cinemas'],
    'Healthcare': ['Apollo Pharmacy', 'Practo Consultations', 'Max Super Specialty Hospital', '1mg Health'],
    'Education': ['Coursera Learning', 'Udemy Tech', 'UpGrad Professional', 'IIT Alumni Program'],
    'Utilities': ['Bescom Power', 'Reliance Digital Store', 'HP Petrol Pump', 'Indian Oil Fuel'],
    'Crypto Exchange': ['Binance Global OTC', 'WazirX Trading', 'CoinSwitch Pro', 'OKX International'],
    'Online Gambling': ['RoyalBet Casino', 'MegaDice Gaming', 'BetOnline Offshore', 'SpinWin Vegas'],
    'Unregulated Remittance': ['QuickRemit Offshore', 'GlobalSwift CashWire', 'ExpressPayout Cayman']
};
const PAYMENT_METHODS = ['credit_card', 'debit_card', 'upi', 'bank_transfer', 'wire_transfer'];
const CITIES = ['Mumbai', 'Bengaluru', 'New Delhi', 'Hyderabad', 'Pune', 'Chennai', 'Ahmedabad', 'Kolkata'];
const SUSPICIOUS_CITIES = ['Lagos (NG)', 'Moscow (RU)', 'Dubai (AE)', 'London (UK)', 'Bucharest (RO)'];
export async function seedDatabase(force = false) {
    if (db.isSeeded() && !force) {
        console.log('Database already contains seed data. Skipping seed.');
        return;
    }
    console.log('Seeding FinShield AI Database with ~1,000 realistic transactions...');
    const state = db.getState();
    // 1. Reset state
    state.users = [];
    state.transactions = [];
    state.fraudAnalysis = {};
    state.fraudAlerts = [];
    state.auditLogs = [];
    state.reports = [];
    state.userBehavior = {};
    state.fraudRules = DEFAULT_RULES;
    // 2. Insert Users
    const salt = bcrypt.genSaltSync(10);
    for (const u of DEMO_USERS) {
        state.users.push({
            id: u.id,
            name: u.name,
            email: u.email,
            passwordHash: bcrypt.hashSync(u.password, salt),
            role: u.role,
            status: u.status,
            createdAt: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString()
        });
    }
    // 3. Setup User Profiles (Home cities and known devices)
    const userProfiles = {
        'usr_user_001': { city: 'Mumbai', device: 'DEV-IPHONE-15-KALP', avg: 1850 },
        'usr_user_002': { city: 'Bengaluru', device: 'DEV-MACBOOK-PRO-VIK', avg: 3200 },
        'usr_user_003': { city: 'New Delhi', device: 'DEV-SAMSUNG-S24-PRI', avg: 1400 },
        'usr_user_004': { city: 'Pune', device: 'DEV-PIXEL-8-ROH', avg: 2100 },
        'usr_user_005': { city: 'Hyderabad', device: 'DEV-IPAD-AIR-ANA', avg: 2900 },
        'usr_admin_001': { city: 'Mumbai', device: 'DEV-THINKPAD-ADMIN', avg: 4500 },
        'usr_analyst_001': { city: 'Bengaluru', device: 'DEV-DELL-ANALYST', avg: 3800 }
    };
    // Pre-seed user behavior profiles so engine can detect deviations
    for (const [uid, prof] of Object.entries(userProfiles)) {
        state.userBehavior[uid] = {
            userId: uid,
            avgAmount: prof.avg,
            maxAmount: prof.avg * 4,
            frequentLocations: [prof.city, 'Pune'],
            knownDevices: [prof.device],
            commonCategories: ['Food', 'Shopping', 'Bills', 'Travel', 'Entertainment'],
            totalTransactions: 0,
            lastTransactionTimestamp: new Date().toISOString()
        };
    }
    const now = Date.now();
    const ninetyDaysMs = 90 * 24 * 3600 * 1000;
    const targetTxCount = 1000;
    // Let's create transactions across the last 90 days
    const transactionsToCreate = [];
    for (let i = 0; i < targetTxCount; i++) {
        // Distribute user: ~40% for primary demo user (Kalp Shah), remainder among others
        const user = (i % 5 === 0 || i % 7 === 0)
            ? DEMO_USERS[2]
            : DEMO_USERS[Math.floor(Math.random() * DEMO_USERS.length)];
        const profile = userProfiles[user.id] || { city: 'Mumbai', device: 'DEV-DEFAULT', avg: 2000 };
        // Timestamp evenly distributed across 90 days with more weight in recent 30 days
        const daysAgo = Math.pow(Math.random(), 1.6) * 90;
        const txTimestamp = new Date(now - daysAgo * 24 * 3600 * 1000);
        // Default daytime hour unless suspicious
        const hour = 8 + Math.floor(Math.random() * 14); // 8 AM to 10 PM
        txTimestamp.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
        // Determine if this should be a synthetic fraudulent/suspicious transaction (~8-10% of dataset)
        const isSuspiciousScenario = (i % 11 === 0);
        const isCriticalFraudScenario = (i % 29 === 0);
        let category;
        let merchant;
        let amount;
        let location;
        let deviceId;
        let paymentMethod;
        if (isCriticalFraudScenario) {
            // High-Value Anomaly + Unusual Night Time + High Risk Merchant + Unknown Device
            category = (i % 2 === 0) ? 'Crypto Exchange' : 'Online Gambling';
            const merchList = MERCHANTS_BY_CATEGORY[category];
            merchant = merchList[Math.floor(Math.random() * merchList.length)];
            amount = Math.floor(65000 + Math.random() * 85000); // ₹65,000 - ₹1,50,000
            location = SUSPICIOUS_CITIES[Math.floor(Math.random() * SUSPICIOUS_CITIES.length)];
            deviceId = `DEV-UNKNOWN-TOR-${Math.floor(100 + Math.random() * 899)}`;
            txTimestamp.setHours(2 + Math.floor(Math.random() * 3)); // 2 AM - 4 AM
            paymentMethod = (i % 2 === 0) ? 'wire_transfer' : 'credit_card';
        }
        else if (isSuspiciousScenario) {
            // Moderate Suspicious Anomaly (e.g. Unusual Location or High Amount or Rapid Velocity)
            const anomalyType = i % 4;
            if (anomalyType === 0) {
                // High amount anomaly
                category = 'Shopping';
                merchant = 'Apple Store Luxury';
                amount = Math.floor(45000 + Math.random() * 25000);
                location = profile.city;
                deviceId = profile.device;
                paymentMethod = 'credit_card';
            }
            else if (anomalyType === 1) {
                // Unknown device + night hour
                category = 'Travel';
                merchant = 'MakeMyTrip International';
                amount = Math.floor(18000 + Math.random() * 15000);
                location = 'Dubai (AE)';
                deviceId = `DEV-ANON-${Math.floor(100 + Math.random() * 899)}`;
                txTimestamp.setHours(3);
                paymentMethod = 'credit_card';
            }
            else if (anomalyType === 2) {
                // High-risk remittance
                category = 'Unregulated Remittance';
                merchant = 'GlobalSwift CashWire';
                amount = Math.floor(35000 + Math.random() * 20000);
                location = profile.city;
                deviceId = profile.device;
                paymentMethod = 'bank_transfer';
            }
            else {
                // Sudden off-category large purchase
                category = 'Shopping';
                merchant = 'Croma Electronics Hub';
                amount = Math.floor(28000 + Math.random() * 12000);
                location = 'Ahmedabad';
                deviceId = `DEV-NEW-ANDROID-${Math.floor(10 + Math.random() * 89)}`;
                paymentMethod = 'upi';
            }
        }
        else {
            // Normal transaction matching user's habits
            const normalCats = ['Food', 'Shopping', 'Bills', 'Travel', 'Entertainment', 'Healthcare', 'Utilities'];
            category = normalCats[Math.floor(Math.random() * normalCats.length)];
            const merchList = MERCHANTS_BY_CATEGORY[category];
            merchant = merchList[Math.floor(Math.random() * merchList.length)];
            // Realistic amount based on category
            if (category === 'Food') {
                amount = Math.floor(250 + Math.random() * 1200);
            }
            else if (category === 'Bills' || category === 'Utilities') {
                amount = Math.floor(800 + Math.random() * 3500);
            }
            else if (category === 'Entertainment') {
                amount = Math.floor(399 + Math.random() * 1800);
            }
            else if (category === 'Healthcare') {
                amount = Math.floor(500 + Math.random() * 2800);
            }
            else if (category === 'Travel') {
                amount = Math.floor(350 + Math.random() * 4500);
            }
            else {
                amount = Math.floor(900 + Math.random() * 6500);
            }
            location = (Math.random() > 0.15) ? profile.city : CITIES[Math.floor(Math.random() * CITIES.length)];
            deviceId = (Math.random() > 0.1) ? profile.device : `${profile.device}-BACKUP`;
            paymentMethod = PAYMENT_METHODS[Math.floor(Math.random() * (PAYMENT_METHODS.length - 1))];
        }
        const txId = `TXN-${100000 + i}`;
        transactionsToCreate.push({
            id: txId,
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            amount,
            currency: 'INR',
            merchant,
            category,
            location,
            paymentMethod,
            deviceId,
            timestamp: txTimestamp.toISOString(),
            status: 'legitimate',
            riskScore: 0,
            riskLevel: 'LOW'
        });
    }
    // Sort by timestamp ascending for sequential fraud evaluation & velocity simulation
    transactionsToCreate.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    // Inject intentional high-velocity burst for demonstration (3 transactions in 4 minutes for Kalp Shah)
    const burstBaseTime = new Date(now - 12 * 3600 * 1000); // 12 hours ago
    const burstTx1 = {
        id: `TXN-BURST-101`,
        userId: 'usr_user_001',
        userName: 'Kalp Shah (Retail Cardholder)',
        userEmail: 'user@finshield.ai',
        amount: 15400,
        currency: 'INR',
        merchant: 'Amazon India',
        category: 'Shopping',
        location: 'Mumbai',
        paymentMethod: 'credit_card',
        deviceId: 'DEV-IPHONE-15-KALP',
        timestamp: new Date(burstBaseTime.getTime() - 3 * 60 * 1000).toISOString(),
        status: 'legitimate',
        riskScore: 0,
        riskLevel: 'LOW'
    };
    const burstTx2 = {
        id: `TXN-BURST-102`,
        userId: 'usr_user_001',
        userName: 'Kalp Shah (Retail Cardholder)',
        userEmail: 'user@finshield.ai',
        amount: 16800,
        currency: 'INR',
        merchant: 'Flipkart Retail',
        category: 'Shopping',
        location: 'Mumbai',
        paymentMethod: 'credit_card',
        deviceId: 'DEV-IPHONE-15-KALP',
        timestamp: new Date(burstBaseTime.getTime() - 1 * 60 * 1000).toISOString(),
        status: 'legitimate',
        riskScore: 0,
        riskLevel: 'LOW'
    };
    const burstTx3 = {
        id: `TXN-BURST-103`,
        userId: 'usr_user_001',
        userName: 'Kalp Shah (Retail Cardholder)',
        userEmail: 'user@finshield.ai',
        amount: 78000,
        currency: 'INR',
        merchant: 'Crypto Exchange Pro',
        category: 'Crypto Exchange',
        location: 'Lagos (NG)',
        paymentMethod: 'wire_transfer',
        deviceId: 'DEV-UNKNOWN-889',
        timestamp: burstBaseTime.toISOString(),
        status: 'legitimate',
        riskScore: 0,
        riskLevel: 'LOW'
    };
    transactionsToCreate.push(burstTx1, burstTx2, burstTx3);
    transactionsToCreate.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    // Run all transactions sequentially through the actual Fraud Engine
    const processedTxs = [];
    let alertCount = 0;
    for (const rawTx of transactionsToCreate) {
        const userRecent = processedTxs
            .filter(t => t.userId === rawTx.userId)
            .slice(-10);
        const userProfile = state.userBehavior[rawTx.userId] || null;
        const evaluation = FraudDetectionEngine.evaluate(rawTx, userProfile, userRecent, state.fraudRules);
        let status = 'legitimate';
        if (evaluation.riskLevel === 'CRITICAL') {
            status = 'confirmed_fraud';
        }
        else if (evaluation.riskLevel === 'HIGH') {
            status = 'suspicious';
        }
        else if (evaluation.riskLevel === 'MEDIUM') {
            status = 'under_review';
        }
        const tx = {
            ...rawTx,
            status,
            riskScore: evaluation.riskScore,
            riskLevel: evaluation.riskLevel
        };
        processedTxs.push(tx);
        // Save fraud analysis
        const analysis = {
            id: `FA-${tx.id}`,
            transactionId: tx.id,
            riskScore: evaluation.riskScore,
            riskLevel: evaluation.riskLevel,
            fraudProbability: evaluation.fraudProbability,
            explanation: evaluation.explanation,
            contributors: evaluation.contributors,
            analyzedAt: tx.timestamp
        };
        state.fraudAnalysis[tx.id] = analysis;
        // Trigger alert if high risk
        if (evaluation.alertTriggered) {
            alertCount++;
            state.fraudAlerts.push({
                id: `ALT-${1000 + alertCount}`,
                transactionId: tx.id,
                userId: tx.userId,
                userName: tx.userName,
                amount: tx.amount,
                merchant: tx.merchant,
                severity: evaluation.alertSeverity || 'high',
                alertType: evaluation.alertType || 'Suspicious Outlier Activity',
                reason: evaluation.explanation,
                status: (alertCount % 3 === 0) ? 'investigating' : ((alertCount % 5 === 0) ? 'resolved' : 'new'),
                createdAt: tx.timestamp
            });
        }
    }
    state.transactions = processedTxs.reverse(); // Latest first
    // Refresh user behavior profiles
    for (const user of state.users) {
        db.refreshUserBehavior(user.id);
    }
    // Pre-seed some realistic audit logs
    state.auditLogs = [
        {
            id: `LOG-${uuidv4().slice(0, 8)}`,
            userId: 'usr_admin_001',
            userName: 'Chief Risk Officer (Admin)',
            userRole: 'admin',
            action: 'System Seed & Initialization',
            details: `Initialized FinShield platform with ${state.transactions.length} verified transactions and ML scoring engine.`,
            ipAddress: '127.0.0.1',
            timestamp: new Date().toISOString()
        },
        {
            id: `LOG-${uuidv4().slice(0, 8)}`,
            userId: 'usr_admin_001',
            userName: 'Chief Risk Officer (Admin)',
            userRole: 'admin',
            action: 'Fraud Rule Baseline Calibrated',
            details: 'High-value threshold set to ₹50,000; velocity window configured to 10 min.',
            ipAddress: '192.168.1.10',
            timestamp: new Date(now - 3600 * 1000).toISOString()
        },
        {
            id: `LOG-${uuidv4().slice(0, 8)}`,
            userId: 'usr_analyst_001',
            userName: 'Sarah Chen (Senior Fraud Analyst)',
            userRole: 'analyst',
            action: 'Alert Case Investigated',
            details: 'Reviewed and confirmed suspicious transaction burst on account usr_user_001.',
            ipAddress: '192.168.1.15',
            timestamp: new Date(now - 1800 * 1000).toISOString()
        }
    ];
    // Pre-seed reports
    state.reports = [
        {
            id: 'REP-001',
            name: 'Monthly Fraud Threat Assessment Q3',
            type: 'fraud',
            recordCount: state.transactions.filter(t => t.riskScore >= 60).length,
            summary: 'Comprehensive analysis of flagged critical transactions and merchant vector vulnerabilities.',
            generatedBy: 'usr_admin_001',
            generatedAt: new Date(now - 48 * 3600 * 1000).toISOString()
        },
        {
            id: 'REP-002',
            name: 'High-Velocity Card Incident Audit',
            type: 'suspicious',
            recordCount: state.fraudAlerts.length,
            summary: 'Incident dossier detailing multiple rapid card swipes and geolocation jump anomalies.',
            generatedBy: 'usr_analyst_001',
            generatedAt: new Date(now - 12 * 3600 * 1000).toISOString()
        }
    ];
    db.saveSync();
    console.log(`Seeding complete! ${state.transactions.length} transactions, ${state.fraudAlerts.length} alerts created.`);
}
// Self-executing runner if invoked directly
if (process.argv[1] && process.argv[1].includes('seed')) {
    seedDatabase(true).catch(console.error);
}
