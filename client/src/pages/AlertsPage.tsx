import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FraudAlert, AlertStatus, AlertSeverity, Transaction } from '../types/shared';
import { useAuth } from '../context/AuthContext';
import { TransactionDetailModal } from '../components/TransactionDetailModal';
import { 
  Bell, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Slash, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink,
  RefreshCw,
  Search
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  // Selected Transaction for Dossier modal
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const isPrivileged = user?.role === 'admin' || user?.role === 'analyst';

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.alerts.getAll({
        page,
        limit: 15,
        status: statusFilter,
        severity: severityFilter,
      });
      setAlerts(res.alerts);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [page, statusFilter, severityFilter]);

  const handleStatusChange = async (alertId: string, newStatus: AlertStatus) => {
    try {
      await api.alerts.updateStatus(alertId, newStatus);
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: newStatus } : a));
    } catch (err: any) {
      alert(`Failed to update alert: ${err.message}`);
    }
  };

  const openTransactionDossier = async (transactionId: string) => {
    try {
      const res = await api.transactions.getById(transactionId);
      setSelectedTx(res.transaction);
    } catch (err: any) {
      alert(`Failed to fetch transaction details: ${err.message}`);
    }
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-rose-500/10 text-rose-500 border border-rose-500/30 uppercase animate-pulse">CRITICAL</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-orange-500/10 text-orange-500 border border-orange-500/30 uppercase">HIGH</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/30 uppercase">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-500/10 text-slate-500 border border-slate-500/30 uppercase">LOW</span>;
    }
  };

  const getStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case 'new':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">New</span>;
      case 'investigating':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">Investigating</span>;
      case 'resolved':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Resolved</span>;
      case 'dismissed':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-500/10 text-slate-500 border border-slate-500/20">Dismissed</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-rose-500" />
            Fraud Incidents & Security Alerts
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Displaying {total} active and archived compliance escalations
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-1">Status:</span>
          {['all', 'new', 'investigating', 'resolved', 'dismissed'].map(st => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setPage(1); }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Severity:</span>
          <select
            value={severityFilter}
            onChange={e => { setSeverityFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3">Alert ID</th>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3">Type & Reason</th>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
                {isPrivileged && <th className="px-5 py-3 text-right">Investigation Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-zinc-500 mb-2" />
                    <span>Loading alerts...</span>
                  </td>
                </tr>
              ) : alerts.length > 0 ? (
                alerts.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-semibold text-rose-500">
                      {a.id}
                    </td>
                    <td className="px-5 py-3.5">
                      {getSeverityBadge(a.severity)}
                    </td>
                    <td className="px-5 py-3.5 max-w-sm">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {a.alertType}
                      </span>
                      <p className="text-slate-500 truncate mt-0.5 text-[11px]" title={a.reason}>
                        {a.reason}
                      </p>
                      <button
                        onClick={() => openTransactionDossier(a.transactionId)}
                        className="text-zinc-700 dark:text-zinc-300 hover:underline inline-flex items-center gap-1 text-[11px] font-mono mt-1"
                      >
                        <span>Linked Tx: {a.transactionId}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">
                      {a.userName || a.userId}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                      ₹{a.amount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(a.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      {getStatusBadge(a.status)}
                    </td>
                    {isPrivileged && (
                      <td className="px-5 py-3.5 text-right">
                        <select
                          value={a.status}
                          onChange={e => handleStatusChange(a.id, e.target.value as AlertStatus)}
                          className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-zinc-700 dark:focus:ring-zinc-400"
                        >
                          <option value="new">New</option>
                          <option value="investigating">Investigating</option>
                          <option value="resolved">Resolved</option>
                          <option value="dismissed">Dismissed</option>
                        </select>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    No fraud alerts match the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing Page <span className="font-bold text-slate-900 dark:text-white">{page}</span> of{' '}
            <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono px-2">{page}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Detail Dossier Modal */}
      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
        onStatusUpdated={() => fetchAlerts()}
      />
    </div>
  );
};
