import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DashboardMetrics, Transaction, FraudAlert } from '../types/shared';
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
  Play
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
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
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

  const fetchMetrics = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await api.dashboard.getMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(() => fetchMetrics(), 20000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateNormal = async () => {
    setSimulating('normal');
    try {
      const res = await api.simulation.normal();
      setSimulationResult({
        transaction: res.transaction,
        message: res.message
      });
      fetchMetrics();
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
      fetchMetrics();
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-2">
        <Activity className="w-6 h-6 text-slate-400 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading risk metrics...</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Failed to load dashboard data.</p>
        <button
          onClick={() => fetchMetrics(true)}
          className="mt-3 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs"
        >
          Retry
        </button>
      </div>
    );
  }

  // Refined enterprise colors
  const PIE_COLORS = ['#10b981', '#0ea5e9', '#f43f5e'];
  const RISK_COLORS = {
    Low: '#10b981',
    Medium: '#f59e0b',
    High: '#f97316',
    Critical: '#ef4444'
  };

  const riskDistributionData = [
    { name: 'Low', count: metrics.riskDistribution.low, color: RISK_COLORS.Low },
    { name: 'Medium', count: metrics.riskDistribution.medium, color: RISK_COLORS.Medium },
    { name: 'High', count: metrics.riskDistribution.high, color: RISK_COLORS.High },
    { name: 'Critical', count: metrics.riskDistribution.critical, color: RISK_COLORS.Critical },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Security & Risk Operations Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time transaction monitoring, anomaly detection, and compliance queue
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchMetrics(true)}
            disabled={refreshing}
            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsAddTxOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Transaction</span>
          </button>
        </div>
      </div>

      {/* Human-designed Simulation Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Transaction Simulation & Testing
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Trigger test transactions directly through the 7-factor engine to demonstrate real-time scoring
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

      {/* 6 Real KPI Metric Cards */}
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              Recent Suspicious Transactions Requiring Review
            </h3>
            <p className="text-xs text-slate-500">Select any row to inspect the complete explainable AI decision dossier</p>
          </div>
          <span className="text-[11px] text-slate-400">
            Top {metrics.recentSuspiciousTransactions.length} items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/60 dark:border-slate-800">
              <tr>
                <th className="px-4 py-2.5">Tx ID</th>
                <th className="px-4 py-2.5">Timestamp</th>
                <th className="px-4 py-2.5">Account</th>
                <th className="px-4 py-2.5">Amount</th>
                <th className="px-4 py-2.5">Merchant</th>
                <th className="px-4 py-2.5">Location</th>
                <th className="px-4 py-2.5">Risk Score</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {metrics.recentSuspiciousTransactions.map(tx => (
                <tr
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-white">
                    {tx.id}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(tx.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white truncate max-w-[120px]">
                    {tx.userName || tx.userId}
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-white">
                    ₹{tx.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {tx.merchant}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {tx.location}
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge level={tx.riskLevel} score={tx.riskScore} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={tx.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium inline-flex items-center gap-0.5">
                      <span>Dossier</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
        onStatusUpdated={(updated) => {
          setSelectedTx(updated);
          fetchMetrics();
        }}
      />

      {/* Simulation Result Modal */}
      <SimulationModal
        isOpen={simulationResult !== null}
        onClose={() => setSimulationResult(null)}
        result={simulationResult}
        onViewTransaction={(tx) => setSelectedTx(tx)}
      />

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        onSuccess={(tx) => {
          setSelectedTx(tx);
          fetchMetrics();
        }}
      />
    </div>
  );
};
