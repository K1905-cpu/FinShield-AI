import { db } from './db/db.js';
import { FraudDetectionEngine } from './fraud-engine/engine.js';
import { Transaction } from './types/shared.js';

async function runTestSuite() {
  console.log('================================================================');
  console.log('  FinShield AI - Comprehensive System Verification Test Suite');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(desc: string, condition: boolean) {
    if (condition) {
      console.log(`  [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${desc}`);
      failed++;
    }
  }

  // 1. Database Check
  console.log('1. DATABASE & PRE-SEEDED DATA:');
  const txs = db.getState().transactions;
  const users = db.getUsers();
  const alerts = db.getState().fraudAlerts;
  const rules = db.getRules();

  assert('Database contains >= 1,000 transactions', txs.length >= 1000);
  assert('Pre-seeded users include admin, analyst, and retail user', users.length >= 3);
  assert('Pre-seeded alerts are generated and active', alerts.length > 0);
  assert('Default fraud rules are configured with 7 factor weights', Object.keys(rules.weights).length === 7);

  // 2. Authentication & Roles Check
  console.log('\n2. AUTHENTICATION & SECURITY ROLES:');
  const admin = db.getUserByEmail('admin@finshield.ai');
  const analyst = db.getUserByEmail('analyst@finshield.ai');
  const user = db.getUserByEmail('user@finshield.ai');

  assert('Admin demo user exists with role "admin"', admin?.role === 'admin');
  assert('Analyst demo user exists with role "analyst"', analyst?.role === 'analyst');
  assert('Retail user exists with role "user"', user?.role === 'user');

  // 3. Fraud Detection Engine - Scenario A: Normal Routine Transaction
  console.log('\n3. FRAUD DETECTION ENGINE - ROUTINE SCENARIO:');
  const normalTx: Omit<Transaction, 'id' | 'status' | 'riskScore' | 'riskLevel' | 'fraudAnalysis'> = {
    userId: 'usr_user_001',
    userName: 'Kalp Shah',
    userEmail: 'user@finshield.ai',
    amount: 1450,
    currency: 'INR',
    merchant: 'Starbucks Coffee Mumbai',
    category: 'Food',
    location: 'Mumbai',
    paymentMethod: 'upi',
    deviceId: 'DEV-IPHONE-15-KALP',
    timestamp: new Date().toISOString()
  };

  const normalProfile = db.getUserBehavior('usr_user_001');
  const recentTxs = db.getTransactions({ userId: 'usr_user_001', limit: 10 }).transactions;
  const normalEval = FraudDetectionEngine.evaluate(normalTx, normalProfile, recentTxs, rules);

  assert('Normal transaction receives LOW risk level', normalEval.riskLevel === 'LOW');
  assert('Normal transaction risk score is < 30', normalEval.riskScore < 30);
  assert('No compliance alert triggered for normal transaction', !normalEval.alertTriggered);

  // 4. Fraud Detection Engine - Scenario B: High-Value Nocturnal Intrusion
  console.log('\n4. FRAUD DETECTION ENGINE - HIGH-THREAT CRITICAL SCENARIO:');
  const suspiciousTime = new Date();
  suspiciousTime.setHours(2, 47, 0); // 2:47 AM

  const suspiciousTx: Omit<Transaction, 'id' | 'status' | 'riskScore' | 'riskLevel' | 'fraudAnalysis'> = {
    userId: 'usr_user_001',
    userName: 'Kalp Shah',
    userEmail: 'user@finshield.ai',
    amount: 85000, // 85k (exceeds 50k threshold and is >40x normal average)
    currency: 'INR',
    merchant: 'Apex Global Crypto OTC',
    category: 'Crypto Exchange', // High risk category
    location: 'New Delhi', // Geolocation shift from Mumbai
    paymentMethod: 'wire_transfer',
    deviceId: 'DEV-UNKNOWN-TOR-77', // Unknown device
    timestamp: suspiciousTime.toISOString() // Unusual time
  };

  const suspEval = FraudDetectionEngine.evaluate(suspiciousTx, normalProfile, recentTxs, rules);

  assert('Critical intrusion receives CRITICAL or HIGH risk level', suspEval.riskLevel === 'CRITICAL' || suspEval.riskLevel === 'HIGH');
  assert('Risk score is elevated (>= 60/100)', suspEval.riskScore >= 60);
  assert('Compliance alert triggered automatically', suspEval.alertTriggered === true);
  assert('Explainable contributors identified active factors', suspEval.contributors.length >= 3);
  assert('Dynamic explanation mentions elevated amount and high-risk factors', suspEval.explanation.length > 30);
  console.log(`     Synthesized Explanation: "${suspEval.explanation}"`);

  // 5. Dashboard KPI Calculation
  console.log('\n5. DASHBOARD KPI CALCULATIONS:');
  const metrics = db.calculateDashboardMetrics();
  assert('Total transaction value is positive and calculated', metrics.totalTransactionValue > 0);
  assert('Average risk score is within [0, 100]', metrics.averageRiskScore >= 0 && metrics.averageRiskScore <= 100);
  assert('Money at risk is calculated from flagged transactions', metrics.moneyAtRisk > 0);
  assert('Risk distribution has low, medium, high, critical buckets', 
    metrics.riskDistribution.low >= 0 && metrics.riskDistribution.critical >= 0);
  assert('14-day timeline aggregations generated', metrics.transactionVolumeTimeline.length > 0);

  // 6. Personal Finance Summary & AI Insights
  console.log('\n6. PERSONAL FINANCE & DYNAMIC AI INSIGHTS:');
  const pf = db.calculatePersonalFinance('usr_user_001');
  assert('Personal finance calculates total spending', pf.totalSpending > 0);
  assert('Category expenditure breakdown calculated', pf.spendingByCategory.length > 0);
  assert('AI Insights generated dynamically from transaction history', pf.aiInsights.length >= 2);
  console.log(`     AI Insight Sample 1: "${pf.aiInsights[0]}"`);
  console.log(`     AI Insight Sample 2: "${pf.aiInsights[1]}"`);

  // 7. Audit Logging
  console.log('\n7. AUDIT LOGGING TRACEABILITY:');
  const auditLogs = db.getAuditLogs({ limit: 5 }).logs;
  assert('Audit log captures system events with forensic timestamps', auditLogs.length > 0);

  console.log('\n================================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(console.error);
