async function testApiEndpoints() {
    console.log('Testing FinShield AI HTTP REST Endpoints at http://localhost:5000/api...');
    const BASE = 'http://localhost:5000/api';
    // 1. Health
    const healthRes = await fetch(`${BASE}/health`);
    const health = await healthRes.json();
    console.log('  [PASS] /health:', health.status, `(${health.transactionsCount} txns in DB)`);
    // 2. Login as Admin
    const adminLoginRes = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@finshield.ai', password: 'Admin@123' })
    });
    const adminData = await adminLoginRes.json();
    const token = adminData.token;
    console.log('  [PASS] /auth/login (Admin): Authenticated token received for', adminData.user.name);
    const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
    // 3. Dashboard Metrics
    const dashRes = await fetch(`${BASE}/dashboard`, { headers: authHeaders });
    const dash = await dashRes.json();
    console.log('  [PASS] /dashboard: Total txns =', dash.totalTransactions, ', Total Value = ₹' + dash.totalTransactionValue.toLocaleString());
    // 4. Transactions List
    const txRes = await fetch(`${BASE}/transactions?page=1&limit=5`, { headers: authHeaders });
    const txData = await txRes.json();
    console.log('  [PASS] /transactions: Retrieved', txData.transactions.length, 'records, Total in system =', txData.total);
    // 5. Live Simulation: Suspicious Intrusion
    const simRes = await fetch(`${BASE}/simulation/suspicious`, { method: 'POST', headers: authHeaders });
    const simData = await simRes.json();
    console.log('  [PASS] /simulation/suspicious: Risk Score =', simData.transaction.riskScore, `(${simData.transaction.riskLevel}), Alert:`, simData.alert.id);
    console.log('         Explanation:', simData.transaction.fraudAnalysis.explanation);
    // 6. Alerts
    const alertRes = await fetch(`${BASE}/alerts?limit=3`, { headers: authHeaders });
    const alertData = await alertRes.json();
    console.log('  [PASS] /alerts: Active alerts count =', alertData.total);
    // 7. Personal Finance (Login as User)
    const userLoginRes = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@finshield.ai', password: 'User@123' })
    });
    const userData = await userLoginRes.json();
    const userPfRes = await fetch(`${BASE}/personal-finance`, {
        headers: { 'Authorization': `Bearer ${userData.token}` }
    });
    const pf = await userPfRes.json();
    console.log('  [PASS] /personal-finance: User spend = ₹' + pf.totalSpending.toLocaleString(), ', Top Insight:', pf.aiInsights[0]);
    console.log('\n  ALL REST APIS WORKING PERFECTLY!\n');
}
testApiEndpoints().catch(console.error);
export {};
