import React from 'react';
import { RiskLevel } from '../types/shared';

interface Props {
  level: RiskLevel;
  score?: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<Props> = ({ level, score, size = 'md' }) => {
  const styles: Record<RiskLevel, { dot: string; bg: string; text: string; label: string }> = {
    LOW: {
      dot: 'bg-emerald-500',
      bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/50',
      text: 'text-emerald-700 dark:text-emerald-300',
      label: 'Low Risk',
    },
    MEDIUM: {
      dot: 'bg-amber-500',
      bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/50',
      text: 'text-amber-700 dark:text-amber-300',
      label: 'Medium Risk',
    },
    HIGH: {
      dot: 'bg-orange-500',
      bg: 'bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-800/50',
      text: 'text-orange-700 dark:text-orange-300',
      label: 'High Risk',
    },
    CRITICAL: {
      dot: 'bg-red-500',
      bg: 'bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800/50',
      text: 'text-red-700 dark:text-red-300',
      label: 'Critical Risk',
    },
  };

  const current = styles[level] || styles.LOW;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-0.5 gap-1.5 font-medium',
    lg: 'text-xs px-3 py-1 gap-2 font-medium',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-md border font-sans ${current.bg} ${current.text} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      <span>{current.label}</span>
      {score !== undefined && (
        <span className="font-mono opacity-75 font-normal">({score})</span>
      )}
    </span>
  );
};
