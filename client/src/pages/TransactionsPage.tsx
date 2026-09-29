import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Transaction } from '../types/shared';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';
import { TransactionDetailModal } from '../components/TransactionDetailModal';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle, 
  RefreshCw, 
  CreditCard,
  FileSpreadsheet,
  Calendar,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(15);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.transactions.getAll({
        page,
        limit,
        search,
        status: statusFilter,
        riskLevel: riskFilter,
        category: categoryFilter,
        minAmount: minAmount ? parseFloat(minAmount) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder
      });

      setTransactions(res.transactions);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, limit, statusFilter, riskFilter, categoryFilter, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setRiskFilter('all');
    setCategoryFilter('all');
    setMinAmount('');
    setMaxAmount('');
    setStartDate('');
    setEndDate('');
    setSortBy('timestamp');
    setSortOrder('desc');
    setPage(1);
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Transaction Ledger & Telemetry
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Displaying {total.toLocaleString()} transactions analyzed by the fraud detection engine
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/upload-csv"
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Upload CSV</span>
          </Link>

          <button
            onClick={() => setIsAddTxOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, merchant, location, or user..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-zinc-700 dark:focus:ring-zinc-400"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Search
          </button>
        </form>

        {/* Filter dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="legitimate">Legitimate</option>
              <option value="under_review">Under Review</option>
              <option value="suspicious">Suspicious</option>
              <option value="confirmed_fraud">Confirmed Fraud</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Risk Level
            </label>
            <select
              value={riskFilter}
              onChange={e => { setRiskFilter(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
            >
              <option value="all">All Risk Tiers</option>
              <option value="LOW">Low (0-29)</option>
              <option value="MEDIUM">Medium (30-59)</option>
              <option value="HIGH">High (60-79)</option>
              <option value="CRITICAL">Critical (80-100)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
            >
              <option value="all">All Categories</option>
              <option value="Shopping">Shopping</option>
              <option value="Food">Food & Dining</option>
              <option value="Travel">Travel</option>
              <option value="Bills">Bills & Utilities</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Crypto Exchange">Crypto Exchange</option>
              <option value="Online Gambling">Online Gambling</option>
              <option value="Unregulated Remittance">Unregulated Remittance</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Min Amount (₹)
            </label>
            <input
              type="number"
              placeholder="e.g. 5000"
              value={minAmount}
              onChange={e => setMinAmount(e.target.value)}
              onBlur={() => { setPage(1); fetchTransactions(); }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Max Amount (₹)
            </label>
            <input
              type="number"
              placeholder="e.g. 100000"
              value={maxAmount}
              onChange={e => setMaxAmount(e.target.value)}
              onBlur={() => { setPage(1); fetchTransactions(); }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3">
                  <button onClick={() => toggleSort('id')} className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white">
                    <span>Tx ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-5 py-3">
                  <button onClick={() => toggleSort('timestamp')} className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white">
                    <span>Date / Time</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">
                  <button onClick={() => toggleSort('amount')} className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white">
                    <span>Amount</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-5 py-3">Merchant</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">
                  <button onClick={() => toggleSort('riskScore')} className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white">
                    <span>Risk Score</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-zinc-500 mb-2" />
                    <span>Loading transactions...</span>
                  </td>
                </tr>
              ) : transactions.length > 0 ? (
                transactions.map(tx => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3 font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                      {tx.id}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-white truncate max-w-[120px]">
                      {tx.userName || tx.userId}
                    </td>
                    <td className="px-5 py-3 font-bold font-mono text-slate-900 dark:text-white">
                      ₹{tx.amount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">
                      {tx.merchant}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {tx.category}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {tx.location}
                    </td>
                    <td className="px-5 py-3 font-mono uppercase text-[11px] text-slate-400">
                      {tx.paymentMethod.replace('_', ' ')}
                    </td>
                    <td className="px-5 py-3">
                      <RiskBadge level={tx.riskLevel} score={tx.riskScore} size="sm" />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={tx.status} size="sm" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-slate-400">
                    No transactions match the specified filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing Page <span className="font-bold text-slate-900 dark:text-white">{page}</span> of{' '}
            <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span> ({total} items)
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

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
        onStatusUpdated={(updated) => {
          setSelectedTx(updated);
          fetchTransactions();
        }}
      />

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        onSuccess={(tx) => {
          setSelectedTx(tx);
          fetchTransactions();
        }}
      />
    </div>
  );
};
