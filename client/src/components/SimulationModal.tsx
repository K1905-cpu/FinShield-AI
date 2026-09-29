import React from 'react';
import { Transaction, FraudAlert } from '../types/shared';
import { RiskBadge } from './RiskBadge';
import { X, ArrowRight, CheckCircle2, AlertTriangle, Shield } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  result: {
    transaction: Transaction;
    alert?: FraudAlert;
    message: string;
  } | null;
  onViewTransaction: (tx: Transaction) => void;
}

export const SimulationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  result,
  onViewTransaction
}) => {
  if (!isOpen || !result) return null;

  const { transaction, alert } = result;
  const isSuspicious = transaction.riskScore >= 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isSuspicious ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
            }`}>
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {isSuspicious ? 'Simulated Suspicious Transaction' : 'Simulated Routine Transaction'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Evaluation completed by the 7-factor scoring engine
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-[11px] text-slate-400 block">{transaction.id}</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  ₹{transaction.amount.toLocaleString()} • {transaction.merchant}
                </span>
                <span className="text-slate-500 block text-[11px] mt-0.5">
                  {transaction.category} • {transaction.location} • {transaction.paymentMethod}
                </span>
              </div>
              <RiskBadge level={transaction.riskLevel} score={transaction.riskScore} size="md" />
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 block mb-1 font-medium">
                Engine Synthesis:
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                "{transaction.fraudAnalysis?.explanation}"
              </p>
            </div>
          </div>

          {alert ? (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />
              <div>
                <span className="font-semibold block">Incident Alert Escalated: #{alert.id}</span>
                <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">{alert.reason}</p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Routine transaction cleared. Risk score ({transaction.riskScore}/100) is within safe limits.</span>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onViewTransaction(transaction);
            }}
            className="text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
          >
            <span>Inspect Full Dossier</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
