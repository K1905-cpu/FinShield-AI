import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  ShieldAlert, 
  Bell, 
  BarChart3, 
  Wallet, 
  FileSpreadsheet, 
  FileText, 
  Users, 
  Sliders, 
  ScrollText, 
  Settings, 
  Shield,
  X
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  alertsCount?: number;
}

export const Sidebar: React.FC<Props> = ({ isOpen, onClose, alertsCount = 0 }) => {
  const { user } = useAuth();
  const role = user?.role || 'user';

  const navItems = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'analyst', 'user'] },
    { label: 'Transactions', to: '/transactions', icon: ArrowLeftRight, roles: ['admin', 'analyst', 'user'] },
    { label: 'Risk Engine', to: '/fraud-detection', icon: ShieldAlert, roles: ['admin', 'analyst', 'user'] },
    { 
      label: 'Alerts Queue', 
      to: '/alerts', 
      icon: Bell, 
      roles: ['admin', 'analyst', 'user'],
      badge: alertsCount > 0 ? alertsCount : undefined 
    },
    { label: 'Analytics', to: '/analytics', icon: BarChart3, roles: ['admin', 'analyst'] },
    { label: 'My Finance', to: '/my-finance', icon: Wallet, roles: ['user', 'admin', 'analyst'] },
    { label: 'Batch Import', to: '/upload-csv', icon: FileSpreadsheet, roles: ['user', 'admin', 'analyst'] },
    { label: 'Audit Reports', to: '/reports', icon: FileText, roles: ['admin', 'analyst'] },
    { label: 'User Directory', to: '/users', icon: Users, roles: ['admin'] },
    { label: 'Rule Settings', to: '/fraud-rules', icon: Sliders, roles: ['admin'] },
    { label: 'Audit Logs', to: '/audit-logs', icon: ScrollText, roles: ['admin'] },
    { label: 'Settings', to: '/settings', icon: Settings, roles: ['admin', 'analyst', 'user'] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(role));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold shadow-sm">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                  FinShield
                </span>
                <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                  Risk
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Fraud & Risk Platform
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role Bar */}
        <div className="px-5 py-2.5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Access Level</span>
          <span className="text-[11px] font-mono font-medium uppercase px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
            {role}
          </span>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {filteredNav.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-rose-500 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Environment</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">Production</span>
          </div>
        </div>
      </aside>
    </>
  );
};
