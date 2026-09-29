import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StatCard } from '../components/StatCard';
import { 
  BarChart3, 
  Download, 
  RefreshCw, 
  ShieldAlert, 
  PieChart as PieIcon, 
  MapPin, 
  Clock, 
  CreditCard,
  IndianRupee,
  Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell, 
  LineChart, 
  Line,
  Legend
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.analytics.getAnalytics({
        category: categoryFilter,
        riskLevel: riskFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [categoryFilter, riskFilter, startDate, endDate]);

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ['Category', 'Total Count', 'Fraud Count', 'Suspicious Count', 'Total Amount (INR)'],
      ...data.categoryBreakdown.map((c: any) => [
        `"${c.category}"`,
        c.totalCount,
        c.fraudCount,
        c.suspiciousCount,
        c.totalAmount
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `finshield_fraud_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Activity className="w-8 h-8 text-zinc-500 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Aggregating database threat analytics...</p>
      </div>
    );
  }

  const metrics = data?.metrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
            Financial Crime & Anomaly Intelligence
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Multivariate risk vectors, attack hourly distributions, and exposure telemetry
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnalytics}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export Analytics CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Category
          </label>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
          >
            <option value="all">All Categories</option>
            <option value="Shopping">Shopping</option>
            <option value="Food">Food & Dining</option>
            <option value="Travel">Travel</option>
            <option value="Bills">Bills</option>
            <option value="Crypto Exchange">Crypto Exchange</option>
            <option value="Online Gambling">Online Gambling</option>
            <option value="Unregulated Remittance">Unregulated Remittance</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Risk Tier
          </label>
          <select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
          >
            <option value="all">All Risk Tiers</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Transactions"
          value={metrics?.totalTransactions.toLocaleString() || 0}
          icon={CreditCard}
          color="slate"
        />

        <StatCard
          title="Suspicious Detected"
          value={metrics?.suspiciousCount || 0}
          icon={ShieldAlert}
          color="amber"
        />

        <StatCard
          title="Confirmed Fraud"
          value={metrics?.fraudCount || 0}
          icon={ShieldAlert}
          color="rose"
        />

        <StatCard
          title="Total Capital at Risk"
          value={`₹${(metrics?.moneyAtRisk || 0).toLocaleString()}`}
          icon={IndianRupee}
          color="purple"
        />
      </div>

      {/* Row 1: Hourly Distribution & Payment Method */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Threat Attack Distribution (0 - 23 hrs) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                Hourly Fraud Activity Curve (24-Hour Timeline)
              </h3>
              <p className="text-xs text-slate-500">Notice nocturnal attack spike between 01:00 - 05:00 hrs</p>
            </div>
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
              Time Heuristic
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.hourDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="total" fill="#64748b" name="Total Transactions" radius={[4, 4, 0, 0]} />
                <Bar dataKey="fraud" fill="#e11d48" name="Flagged Fraud" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Rail Vulnerability */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-purple-500" />
                Risk Exposure by Payment Rail
              </h3>
              <p className="text-xs text-slate-500">Volume and fraud incidence across settlement mechanisms</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.paymentBreakdown || []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="method" stroke="#94a3b8" fontSize={10} tickFormatter={m => m.replace('_', ' ')} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" name="Transactions" radius={[4, 4, 0, 0]} />
                <Bar dataKey="fraudCount" fill="#f43f5e" name="Flagged Threats" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Location and Category Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geographic Incident Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Top Geographic Incident Geolocation Hubs
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">Location</th>
                  <th className="px-4 py-2.5">Total Txns</th>
                  <th className="px-4 py-2.5">Threats</th>
                  <th className="px-4 py-2.5 text-right">Total Exposure (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {data?.locationBreakdown?.map((loc: any) => (
                  <tr key={loc.location} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">
                      {loc.location}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{loc.count}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        loc.fraudCount > 0 ? 'bg-rose-500/10 text-rose-500' : 'text-slate-400'
                      }`}>
                        {loc.fraudCount}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-900 dark:text-white text-right">
                      ₹{loc.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Exposure Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Category Threat Vectors
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Transactions</th>
                  <th className="px-4 py-2.5">Threat Count</th>
                  <th className="px-4 py-2.5 text-right">Volume (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {data?.categoryBreakdown?.map((cat: any) => (
                  <tr key={cat.category} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">
                      {cat.category}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{cat.totalCount}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        (cat.fraudCount + cat.suspiciousCount) > 0 ? 'bg-rose-500/10 text-rose-500' : 'text-slate-400'
                      }`}>
                        {cat.fraudCount + cat.suspiciousCount}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-900 dark:text-white text-right">
                      ₹{cat.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
