import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PersonalFinanceSummary, Transaction } from '../types/shared';
import { StatCard } from '../components/StatCard';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';
import { TransactionDetailModal } from '../components/TransactionDetailModal';
import { 
  Wallet, 
  IndianRupee, 
  Calendar, 
  Sparkles, 
  CreditCard, 
  PieChart as PieIcon, 
  TrendingUp, 
  ShieldAlert, 
  Activity, 
  CheckCircle, 
  ArrowUpRight 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export const MyFinancePage: React.FC = () => {
  const [data, setData] = useState<PersonalFinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    const fetchFinance = async () => {
      try {
        const res = await api.personalFinance.getSummary();
        setData(res);
      } catch (err) {
        console.error('Failed to load personal finance:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFinance();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Activity className="w-8 h-8 text-zinc-500 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Compiling personal spending telemetry...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>No personal finance records available for this account.</p>
      </div>
    );
  }

  const PIE_COLORS = ['#10b981', '#f59e0b', '#64748b', '#8b5cf6', '#0ea5e9', '#ec4899', '#f97316'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Wallet className="w-3.5 h-3.5" />
          Retail Cardholder Dashboard
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          My Financial Spend & Risk Baseline
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Monitor your personal budget, review spending anomalies, and track account security
        </p>
      </div>

      {/* AI Behavioral Insights Panel (Requirement 17) */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            FinShield Personalized Behavioral Risk Insights
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {data.aiInsights.map((insight, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-200 flex items-start gap-2.5"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{insight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Expenditure"
          value={`₹${data.totalSpending.toLocaleString()}`}
          icon={IndianRupee}
          color="slate"
        />

        <StatCard
          title="Current Month"
          value={`₹${data.monthlySpending.toLocaleString()}`}
          icon={Calendar}
          color="emerald"
        />

        <StatCard
          title="Avg Transaction Size"
          value={`₹${data.averageTransaction.toLocaleString()}`}
          icon={CreditCard}
          color="purple"
        />

        <StatCard
          title="Largest Transaction"
          value={`₹${data.largestTransaction.toLocaleString()}`}
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending by Category (Donut) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Expenditure by Category
          </h3>
          <p className="text-xs text-slate-500 mb-2">Proportion of your monthly budget</p>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.spendingByCategory}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                >
                  {data.spendingByCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any) => `₹${Number(val).toLocaleString()}`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {data.spendingByCategory.slice(0, 4).map((c, i) => (
              <div key={c.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{c.category}</span>
                </div>
                <span className="font-mono text-slate-500 font-bold">
                  ₹{c.amount.toLocaleString()} ({c.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Spending Trend (Last 6 Months) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Monthly Spend Trend
          </h3>
          <p className="text-xs text-slate-500 mb-4">Historical 6-month budget tracking</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlySpendingTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  formatter={(val: any) => `₹${Number(val).toLocaleString()}`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc', fontSize: '12px' }}
                />
                <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} name="Spending (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Spending Trend */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Weekly Velocity
          </h3>
          <p className="text-xs text-slate-500 mb-4">Spending across the last 4 weeks</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weeklySpendingTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  formatter={(val: any) => `₹${Number(val).toLocaleString()}`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc', fontSize: '12px' }}
                />
                <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} name="Weekly Outflow" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Personal Alerts & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Risk Alerts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            Security & Anomaly Alerts
          </h3>
          <p className="text-xs text-slate-500 mb-4">Transactions flagged on your account</p>

          {data.personalAlerts.length > 0 ? (
            <div className="space-y-2.5">
              {data.personalAlerts.map(a => (
                <div
                  key={a.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{a.alertType}</span>
                    <span className="font-mono text-rose-500 font-bold uppercase">{a.severity}</span>
                  </div>
                  <p className="text-slate-500 truncate">{a.reason}</p>
                  <span className="text-[10px] text-slate-400 block pt-1">
                    ₹{a.amount.toLocaleString()} • {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <CheckCircle className="w-6 h-6 mx-auto mb-1.5 text-emerald-500" />
              <span>No active security threats on your account.</span>
            </div>
          )}
        </div>

        {/* Recent Cardholder Transactions Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Personal Activity
            </h3>
            <p className="text-xs text-slate-500">Your latest transactions with risk status</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Merchant</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5">Risk Tier</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {data.recentTransactions.map(tx => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                  >
                    <td className="px-4 py-2.5 text-slate-500">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">
                      {tx.merchant}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{tx.category}</td>
                    <td className="px-4 py-2.5 font-bold font-mono text-slate-900 dark:text-white">
                      ₹{tx.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <RiskBadge level={tx.riskLevel} score={tx.riskScore} size="sm" />
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={tx.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
};
