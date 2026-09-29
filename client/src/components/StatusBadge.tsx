import React from 'react';
import { TransactionStatus } from '../types/shared';

interface Props {
  status: TransactionStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const config: Record<TransactionStatus, { bg: string; text: string; label: string }> = {
    legitimate: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
      text: 'text-emerald-700 dark:text-emerald-300',
      label: 'Approved',
    },
    under_review: {
      bg: 'bg-zinc-100 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700',
      text: 'text-zinc-800 dark:text-zinc-200',
      label: 'Under Review',
    },
    suspicious: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50',
      text: 'text-amber-700 dark:text-amber-300',
      label: 'Suspicious',
    },
    confirmed_fraud: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50',
      text: 'text-rose-700 dark:text-rose-300',
      label: 'Confirmed Fraud',
    },
    dismissed: {
      bg: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700/60',
      text: 'text-slate-500',
      label: 'Dismissed',
    },
  };

  const current = config[status] || config.legitimate;
  const sizeClass = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-0.5 font-medium';

  return (
    <span className={`inline-flex items-center rounded border ${current.bg} ${sizeClass}`}>
      {current.label}
    </span>
  );
};
