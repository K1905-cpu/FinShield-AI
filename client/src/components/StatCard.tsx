import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'slate' | 'emerald' | 'amber' | 'rose' | 'purple';
}

export const StatCard: React.FC<Props> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className="text-slate-400 dark:text-slate-500">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
          {value}
        </div>
        
        <div className="mt-1 flex items-center justify-between text-xs">
          {subtitle && (
            <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
              {subtitle}
            </span>
          )}

          {trend && (
            <span className={`font-medium text-[11px] ${trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
              {trend.isPositive ? '+' : '-'}{trend.value}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
