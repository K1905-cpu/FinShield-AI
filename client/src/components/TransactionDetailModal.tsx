import React, { useState } from 'react';
import { Transaction, TransactionStatus } from '../types/shared';
import { RiskBadge } from './RiskBadge';
import { StatusBadge } from './StatusBadge';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  X, 
  MapPin, 
  Clock, 
  Smartphone, 
  CreditCard, 
  User as UserIcon, 
  CheckCircle2,
  FileCheck2,
  Building
} from 'lucide-react';

interface Props {
  transaction: Transaction | null;
  onClose: () => void;
  onStatusUpdated?: (updatedTx: Transaction) => void;
}

export const TransactionDetailModal: React.FC<Props> = ({
  transaction,
  onClose,
  onStatusUpdated
}) => {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<TransactionStatus>(
    transaction?.status || 'legitimate'
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!transaction) return null;

  const analysis = transaction.fraudAnalysis;
  const canManageStatus = user?.role === 'admin' || user?.role === 'analyst';

  const handleStatusChange = async (newStatus: TransactionStatus) => {
    setIsUpdating(true);
    setSuccessMessage(null);
    try {
      const res = await api.transactions.updateStatus(transaction.id, newStatus);
      setCurrentStatus(newStatus);
      setSuccessMessage(`Transaction status updated to ${newStatus}.`);
      if (onStatusUpdated && res.transaction) {
        onStatusUpdated(res.transaction);
      }
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-xl my-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Transaction Audit Dossier
              </h3>
              <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                {transaction.id}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Evaluated by FinShield Risk Engine
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Top Score Summary */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">
                Calculated Risk Score
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {transaction.riskScore}
                </span>
                <span className="text-xs text-slate-400 font-mono">/100</span>
                <RiskBadge level={transaction.riskLevel} size="sm" />
              </div>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-500 block">
                Fraud Probability
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {analysis?.fraudProbability || transaction.riskScore}%
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-500 block">
                Status
              </span>
              <div className="mt-1">
                <StatusBadge status={currentStatus} />
              </div>
            </div>
          </div>

          {/* Explainable AI Heuristics */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Explainable Decision Breakdown
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">7-Factor Heuristic</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Synthesized Explanation:
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                "{analysis?.explanation || 'No abnormal divergence detected across established baseline heuristics.'}"
              </p>
            </div>

            {/* Contributing factors */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Factor Contributions:
              </span>

              {analysis?.contributors && analysis.contributors.length > 0 ? (
                <div className="space-y-2">
                  {analysis.contributors.map(c => (
                    <div key={c.factor} className="p-2.5 rounded-lg border border-slate-200/70 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-slate-900 dark:text-white">{c.label}</span>
                        <span className="font-mono text-slate-500">
                          {c.score} / {c.maxScore} pts ({c.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-slate-800 dark:bg-slate-200"
                          style={{ width: `${c.percentage}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{c.reason}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-700 dark:text-emerald-300 p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/30">
                  Clean transaction. All factors within standard baseline limits.
                </p>
              )}
            </div>
          </div>

          {/* Transaction Metadata Grid */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Transaction Metadata
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                <span className="text-slate-400 block mb-0.5">Amount</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono text-sm">
                  ₹{transaction.amount.toLocaleString()} {transaction.currency}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                <span className="text-slate-400 block mb-0.5">Merchant</span>
                <span className="font-semibold text-slate-900 dark:text-white block truncate">
                  {transaction.merchant}
                </span>
                <span className="text-[11px] text-slate-500">{transaction.category}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Timestamp
                </span>
                <span className="font-mono text-slate-900 dark:text-white text-[11px] block mt-0.5">
                  {new Date(transaction.timestamp).toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Location
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {transaction.location}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
                  <CreditCard className="w-3 h-3" /> Payment Method
                </span>
                <span className="font-mono uppercase text-slate-900 dark:text-white text-[11px]">
                  {transaction.paymentMethod.replace('_', ' ')}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
                  <Smartphone className="w-3 h-3" /> Device Signature
                </span>
                <span className="font-mono text-slate-900 dark:text-white truncate block text-[11px]" title={transaction.deviceId}>
                  {transaction.deviceId}
                </span>
              </div>
            </div>
          </div>

          {/* Investigation Controls */}
          {canManageStatus && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Analyst Disposition
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Updates the transaction resolution status and records an audit log entry
                  </p>
                </div>

                <select
                  value={currentStatus}
                  disabled={isUpdating}
                  onChange={(e) => handleStatusChange(e.target.value as TransactionStatus)}
                  className="text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white"
                >
                  <option value="legitimate">Approve (Legitimate)</option>
                  <option value="under_review">Mark Under Review</option>
                  <option value="suspicious">Flag Suspicious</option>
                  <option value="confirmed_fraud">Confirm Fraud</option>
                  <option value="dismissed">Dismiss Case</option>
                </select>
              </div>

              {successMessage && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {successMessage}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
