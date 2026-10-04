import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DashboardMetrics, Transaction, FraudAlert, PersonalFinanceSummary } from '../types/shared';
import { StatCard } from '../components/StatCard';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';
import { TransactionDetailModal } from '../components/TransactionDetailModal';
import { SimulationModal } from '../components/SimulationModal';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { 
  CreditCard, 
  IndianRupee, 
  ShieldAlert, 
  AlertOctagon, 
  Activity, 
  AlertTriangle, 
  PlusCircle, 
  RefreshCw, 
  ChevronRight,
  ShieldCheck,
  SlidersHorizontal,
  Play,
  Wallet,
  Users,
  Sliders,
  ScrollText,
  FileSpreadsheet,
  ArrowUpRight,
  Sparkles,
  Bell,
  CheckCircle2,
  Lock,
  ArrowLeftRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role || 'user';

  // Admin / Analyst Metrics State
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<FraudAlert[]>([]);

  // Retail User Personal Finance State
  const [personalFinance, setPersonalFinance] = useState<PersonalFinanceSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Simulation states
  const [simulating, setSimulating] = useState<'normal' | 'suspicious' | null>(null);
  const [simulationResult, setSimulationResult] = useState<{
    transaction: Transaction;
    alert?: FraudAlert;
    message: string;
  } | null>(null);

  // Add transaction modal
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      if (role === 'user') {
        const finData = await api.personalFinance.getSummary();
        setPersonalFinance(finData);
      } else if (role === 'analyst') {
        const [dashData, alertsData] = await Promise.all([
          api.dashboard.getMetrics(),
          api.alerts.getAll({ status: 'active', limit: 6 })
        ]);
        setMetrics(dashData);
        setActiveAlerts(alertsData.alerts || []);
      } else {
        // Admin
        const dashData = await api.dashboard.getMetrics();
        setMetrics(dashData);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 25000);
    return () => clearInterval(interval);
  }, [role]);

  const handleSimulateNormal = async () => {
    setSimulating('normal');
    try {
      const res = await api.simulation.normal();
      setSimulationResult({
        transaction: res.transaction,
        message: res.message
      });
      fetchData();
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(null);
    }
  };

  const handleSimulateSuspicious = async () => {
    setSimulating('suspicious');
    try {
      const res = await api.simulation.suspicious();
      setSimulationResult({
        transaction: res.transaction,
        alert: res.alert,
        message: res.message
      });
      fetchData();
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(null);
    }
  };

  const handleQuickResolveAlert = async (alertId: string, resolution: 'resolved' | 'dismissed') => {
    try {
      await api.alerts.updateStatus(alertId, resolution);
      setActiveAlerts(prev => prev.filter(a => a.id !== alertId));
      fetchData();
    } catch (err: any) {
      alert(`Failed to update alert: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-2">
        <Activity className="w-6 h-6 text-slate-400 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading security terminal...</p>
      </div>
    );
  }

  // Common colors
  const PIE_COLORS = ['#10b981', '#0ea5e9', '#f43f5e'];
  const RISK_COLORS = {
    Low: '#10b981',
    Medium: '#f59e0b',
    High: '#f97316',
    Critical: '#ef4444'
  };

  // =========================================================================
  // 1. RETAIL USER (CARDHOLDER) VIEW
  // =========================================================================
  if (role === 'user' && personalFinance) {
    const categoryColors = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'];

    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Cardholder Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/80 uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Retail Cardholder • Protected
              </span>
              <span className="text-[11px] text-slate-400">Account #{user?.id.slice(-6).toUpperCase()}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Personal Account & Card Defense Hub
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Welcome back, <strong className="text-slate-800 dark:text-slate-200">{user?.name}</strong>. Real-time telemetry protecting your cards and payments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <Link
              to="/upload-csv"
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>Import CSV</span>
            </Link>

            <button
              onClick={() => setIsAddTxOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Payment</span>
            </button>
          </div>
        </div>

        {/* Cardholder Protection Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">FinShield Defense Shield Active</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">0 Breaches</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Your payment cards are actively monitored by our 7-factor anomaly engine. Transactions with abnormal velocities or offshore geolocations will trigger instant challenge authorization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/my-finance"
              className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors flex items-center gap-1"
            >
              <span>Full Statements</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 4 Cardholder Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Account Spend"
            value={`₹${(personalFinance.totalSpending / 100000).toFixed(2)}L`}
            subtitle={`₹${personalFinance.totalSpending.toLocaleString()} total outflow`}
            icon={Wallet}
          />

          <StatCard
            title="Average Transaction"
            value={`₹${personalFinance.averageTransaction.toLocaleString()}`}
            subtitle="Typical purchase size"
            icon={IndianRupee}
          />

          <StatCard
            title="Peak Single Outflow"
            value={`₹${personalFinance.largestTransaction.toLocaleString()}`}
            subtitle="Largest recorded swipe"
            icon={CreditCard}
          />

          <StatCard
            title="Security Alerts"
            value={personalFinance.personalAlerts.length}
            subtitle={personalFinance.personalAlerts.length > 0 ? "Requires review" : "All transactions verified"}
            icon={personalFinance.personalAlerts.length > 0 ? AlertTriangle : ShieldCheck}
          />
        </div>

        {/* AI Behavioral Insights Box */}
        {personalFinance.aiInsights.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Personal AI Account Intelligence
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
              {personalFinance.aiInsights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-white dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visual Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Spending Trend */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                  Monthly Outflow Profile
                </h3>
                <p className="text-xs text-slate-500">6-month consolidated expenditure trajectory</p>
              </div>
              <span className="text-[11px] font-medium text-slate-500">₹ Monthly</span>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={personalFinance.monthlySpendingTrend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '11px' }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Total Spend']}
                  />
                  <Bar dataKey="amount" fill="#0f172a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                Category Expenditure
              </h3>
              <p className="text-xs text-slate-500">Top merchant classification share</p>
            </div>

            <div className="h-44 w-full my-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={personalFinance.spendingByCategory.slice(0, 5)}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                  >
                    {personalFinance.spendingByCategory.slice(0, 5).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '11px' }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Spent']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              {personalFinance.spendingByCategory.slice(0, 4).map((c, i) => (
                <div key={c.category} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColors[i] }} />
                    <span className="text-slate-600 dark:text-slate-400 truncate max-w-[120px]">{c.category}</span>
                  </div>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">₹{c.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Cardholder Transactions Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 sm:px-6 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                My Recent Card Transactions
              </h3>
              <p className="text-xs text-slate-500">Live feed of transactions executed under your cardholder profile</p>
            </div>
            <Link
              to="/transactions"
              className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Transaction ID</th>
                  <th className="py-3 px-4 font-semibold">Merchant</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Location</th>
                  <th className="py-3 px-4 font-semibold">Risk Score</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {personalFinance.recentTransactions.slice(0, 6).map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-white">{tx.id}</td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{tx.merchant}</td>
                    <td className="py-3 px-4 text-slate-500">{tx.category}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">₹{tx.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-500">{tx.location}</td>
                    <td className="py-3 px-4">
                      <RiskBadge level={tx.riskLevel} score={tx.riskScore} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-[11px] font-medium transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modals */}
        {selectedTx && (
          <TransactionDetailModal
            transaction={selectedTx}
            onClose={() => setSelectedTx(null)}
          />
        )}
        <AddTransactionModal
          isOpen={isAddTxOpen}
          onClose={() => setIsAddTxOpen(false)}
          onSuccess={() => fetchData()}
        />
      </div>
    );
  }

  // =========================================================================
  // 2. ANALYST (FRAUD OPERATIONS) VIEW
  // =========================================================================
  if (role === 'analyst' && metrics) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Analyst Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800/80 uppercase tracking-wider">
                <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                Senior Fraud Analyst • Incident Response
              </span>
              <span className="text-[11px] text-slate-400">Level-2 Triage Terminal</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Fraud Operations Center & Triage Queue
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live case queue, 7-factor explainable telemetry, and instant threat resolution.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Refresh Queue"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <Link
              to="/alerts"
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5 text-amber-500" />
              <span>Full Alert Queue</span>
            </Link>

            <Link
              to="/reports"
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Incident Dossier</span>
            </Link>
          </div>
        </div>

        {/* Analyst Simulation Toolbar */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Threat Vector Simulation Bar
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate real-time attacks or routine traffic to observe 7-factor telemetry score shifts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateNormal}
              disabled={simulating !== null}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{simulating === 'normal' ? 'Testing...' : 'Simulate Routine Tx'}</span>
            </button>

            <button
              onClick={handleSimulateSuspicious}
              disabled={simulating !== null}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{simulating === 'suspicious' ? 'Evaluating Attack...' : 'Simulate Attack (₹85k / 2:47 AM)'}</span>
            </button>
          </div>
        </div>

        {/* 4 Analyst Operational Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Unresolved Alerts"
            value={activeAlerts.length}
            subtitle="Pending triage"
            icon={Bell}
          />

          <StatCard
            title="Suspicious Cases"
            value={metrics.suspiciousTransactions}
            subtitle="Score >= 60"
            icon={AlertTriangle}
          />

          <StatCard
            title="Confirmed Fraud"
            value={metrics.confirmedFraud}
            subtitle="Breaches blocked"
            icon={AlertOctagon}
          />

          <StatCard
            title="Capital at Risk"
            value={`₹${(metrics.moneyAtRisk / 100000).toFixed(1)}L`}
            subtitle={`₹${metrics.moneyAtRisk.toLocaleString()}`}
            icon={ShieldAlert}
          />
        </div>

        {/* Priority Incident Queue (Actionable Table for Analysts) */}
        {activeAlerts.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Active Priority Alert Queue (Triage Required)
                </h3>
              </div>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Requires Investigation</span>
            </div>

            <div className="space-y-2.5">
              {activeAlerts.slice(0, 4).map(alert => (
                <div 
                  key={alert.id}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{alert.id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                        {alert.severity}
                      </span>
                      <span className="text-xs text-slate-500">Transaction: {alert.transactionId}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">{alert.reason}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleQuickResolveAlert(alert.id, 'resolved')}
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-colors"
                    >
                      Verify / Resolve
                    </button>
                    <button
                      onClick={() => handleQuickResolveAlert(alert.id, 'dismissed')}
                      className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts: Daily Threat Trajectory & Top Vulnerability Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
              Flagged Threat Trajectory (Suspicious vs Fraud)
            </h3>
            <p className="text-xs text-slate-500 mb-4">Daily incident frequency across monitored streams</p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.fraudTrend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="date" tickFormatter={d => d.slice(5)} stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                  <Line type="monotone" dataKey="suspicious" stroke="#f59e0b" strokeWidth={1.5} name="Suspicious" dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="fraud" stroke="#ef4444" strokeWidth={1.5} name="Confirmed Fraud" dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
              Top Vulnerability Sectors
            </h3>
            <p className="text-xs text-slate-500 mb-4">Merchant vectors generating the highest risk scores</p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.fraudCategories} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                  <YAxis dataKey="category" type="category" width={85} stroke="#94a3b8" fontSize={9} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '11px' }}
                  />
                  <Bar dataKey="count" fill="#475569" radius={[0, 4, 4, 0]} name="Flagged Events" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Flagged Transactions for Analyst Review */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 sm:px-6 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                High-Risk Transactions Awaiting Verification
              </h3>
              <p className="text-xs text-slate-500">Live feed of transactions flagged with score &gt;= 60</p>
            </div>
            <Link
              to="/transactions"
              className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Tx ID</th>
                  <th className="py-3 px-4 font-semibold">Merchant</th>
                  <th className="py-3 px-4 font-semibold">Cardholder</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Risk Score</th>
                  <th className="py-3 px-4 font-semibold">Risk Factors</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {metrics.recentSuspiciousTransactions.slice(0, 6).map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-white">{tx.id}</td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{tx.merchant}</td>
                    <td className="py-3 px-4 text-slate-500">{tx.userName || 'Customer'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">₹{tx.amount.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <RiskBadge level={tx.riskLevel} score={tx.riskScore} />
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-[200px] truncate">
                      {tx.fraudAnalysis?.explanation || 'Multiple heuristic flags'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="px-2.5 py-1 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 text-[11px] font-semibold transition-colors"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modals */}
        {selectedTx && (
          <TransactionDetailModal
            transaction={selectedTx}
            onClose={() => setSelectedTx(null)}
          />
        )}
        <AddTransactionModal
          isOpen={isAddTxOpen}
          onClose={() => setIsAddTxOpen(false)}
          onSuccess={() => fetchData()}
        />
        <SimulationModal
          isOpen={!!simulationResult}
          result={simulationResult}
          onClose={() => setSimulationResult(null)}
          onViewTransaction={(tx) => setSelectedTx(tx)}
        />
      </div>
    );
  }

  // =========================================================================
  // 3. ADMIN (CHIEF RISK OFFICER / EXECUTIVE) VIEW
  // =========================================================================
  if (!metrics) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Failed to load dashboard data.</p>
        <button
          onClick={() => fetchData(true)}
          className="mt-3 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs"
        >
          Retry
        </button>
      </div>
    );
  }

  const riskDistributionData = [
    { name: 'Low', count: metrics.riskDistribution.low, color: RISK_COLORS.Low },
    { name: 'Medium', count: metrics.riskDistribution.medium, color: RISK_COLORS.Medium },
    { name: 'High', count: metrics.riskDistribution.high, color: RISK_COLORS.High },
    { name: 'Critical', count: metrics.riskDistribution.critical, color: RISK_COLORS.Critical },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Enterprise Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-950 uppercase tracking-wider">
              <Lock className="w-3 h-3" />
              Chief Risk Officer • Enterprise Command
            </span>
            <span className="text-[11px] text-slate-400">Governance & Compliance Terminal</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Institutional Risk Intelligence Core
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Platform-wide exposure monitoring, 7-factor heuristic engine weights, and regulatory compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/users"
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Directory</span>
          </Link>

          <Link
            to="/fraud-rules"
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Rule Weights</span>
          </Link>

          <button
            onClick={() => setIsAddTxOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Transaction</span>
          </button>
        </div>
      </div>

      {/* Admin Simulation Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Heuristic Engine Simulation & Stress Test
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Trigger live simulated scenarios to demonstrate deterministic 7-factor explainable scoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateNormal}
            disabled={simulating !== null}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{simulating === 'normal' ? 'Testing...' : 'Simulate Routine Tx'}</span>
          </button>

          <button
            onClick={handleSimulateSuspicious}
            disabled={simulating !== null}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{simulating === 'suspicious' ? 'Evaluating Attack...' : 'Simulate Suspicious Tx (₹85k / 2:47 AM)'}</span>
          </button>
        </div>
      </div>

      {/* 6 Real Enterprise KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Total Transactions"
          value={metrics.totalTransactions.toLocaleString()}
          subtitle="Processed"
          icon={CreditCard}
        />

        <StatCard
          title="Total Volume"
          value={`₹${(metrics.totalTransactionValue / 100000).toFixed(1)}L`}
          subtitle={`₹${metrics.totalTransactionValue.toLocaleString()}`}
          icon={IndianRupee}
        />

        <StatCard
          title="Suspicious Cases"
          value={metrics.suspiciousTransactions}
          subtitle="High-risk flagged"
          icon={AlertTriangle}
        />

        <StatCard
          title="Confirmed Fraud"
          value={metrics.confirmedFraud}
          subtitle="Critical breaches"
          icon={AlertOctagon}
        />

        <StatCard
          title="Average Risk Score"
          value={`${metrics.averageRiskScore}`}
          subtitle="Out of 100 max"
          icon={Activity}
        />

        <StatCard
          title="Capital at Risk"
          value={`₹${(metrics.moneyAtRisk / 100000).toFixed(1)}L`}
          subtitle="Flagged total"
          icon={ShieldAlert}
        />
      </div>

      {/* Charts Grid: Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Volume Timeline */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                Transaction Volume Timeline
              </h3>
              <p className="text-xs text-slate-500">14-day rolling settlement count</p>
            </div>
            <span className="text-[11px] font-medium text-slate-500">Daily View</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.transactionVolumeTimeline}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={d => d.slice(5)} 
                  stroke="#94a3b8" 
                  fontSize={10} 
                />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    borderColor: '#334155', 
                    borderRadius: '0.5rem', 
                    color: '#f8fafc', 
                    fontSize: '11px' 
                  }}
                  formatter={(val: any, name?: any) => [
                    name === 'value' ? `₹${Number(val).toLocaleString()}` : val, 
                    name === 'value' ? 'Total Amount' : 'Transaction Count'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#0f172a" 
                  strokeWidth={2} 
                  dot={{ r: 2.5 }} 
                  activeDot={{ r: 5 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fraud vs Legitimate Ratio */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              Settlement Status Distribution
            </h3>
            <p className="text-xs text-slate-500">Breakdown by resolution status</p>
          </div>

          <div className="h-44 w-full my-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.fraudVsLegit}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={3}
                >
                  {metrics.fraudVsLegit.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    borderColor: '#334155', 
                    borderRadius: '0.5rem', 
                    color: '#f8fafc', 
                    fontSize: '11px' 
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            {metrics.fraudVsLegit.map((item, idx) => (
              <div key={item.name}>
                <span className="inline-block w-2 h-2 rounded-full mb-1" style={{ backgroundColor: PIE_COLORS[idx] }} />
                <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">{item.name}</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white font-mono">{item.count}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Grid: Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Risk Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
            Risk Tier Distribution
          </h3>
          <p className="text-xs text-slate-500 mb-4">Volume stratified by calculated risk range</p>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistributionData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '11px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {riskDistributionData.map(entry => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fraud Daily Trend */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
            Flagged Threat Trajectory
          </h3>
          <p className="text-xs text-slate-500 mb-4">Daily suspicious & confirmed incidents</p>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.fraudTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="date" tickFormatter={d => d.slice(5)} stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                <Line type="monotone" dataKey="suspicious" stroke="#f59e0b" strokeWidth={1.5} name="Suspicious" dot={{ r: 2 }} />
                <Line type="monotone" dataKey="fraud" stroke="#ef4444" strokeWidth={1.5} name="Fraud" dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Flagged Fraud Categories */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
            Top Vulnerability Sectors
          </h3>
          <p className="text-xs text-slate-500 mb-4">Highest occurrence of flagged transactions</p>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.fraudCategories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                <YAxis dataKey="category" type="category" width={85} stroke="#94a3b8" fontSize={9} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#64748b" radius={[0, 4, 4, 0]} name="Flagged Events" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Suspicious Transactions Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              Recent Suspicious Transactions
            </h3>
            <p className="text-xs text-slate-500">Chronological telemetry of elevated risk scores requiring administrative review</p>
          </div>
          <Link
            to="/transactions"
            className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Transaction ID</th>
                <th className="py-3 px-4 font-semibold">Merchant</th>
                <th className="py-3 px-4 font-semibold">User</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold">Risk Level</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {metrics.recentSuspiciousTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-white">{tx.id}</td>
                  <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{tx.merchant}</td>
                  <td className="py-3 px-4 text-slate-500">{tx.userName || tx.userId}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">₹{tx.amount.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <RiskBadge level={tx.riskLevel} score={tx.riskScore} />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedTx(tx)}
                      className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-[11px] font-medium transition-colors"
                    >
                      Audit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {selectedTx && (
        <TransactionDetailModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
      <AddTransactionModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        onSuccess={() => fetchData()}
      />
      <SimulationModal
        isOpen={!!simulationResult}
        result={simulationResult}
        onClose={() => setSimulationResult(null)}
        onViewTransaction={(tx) => setSelectedTx(tx)}
      />
    </div>
  );
};
export default DashboardPage;
