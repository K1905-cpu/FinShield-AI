import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Settings, User, Moon, Sun, Shield, Info, LogOut, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          System Preferences & Account Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage identity security, dashboard aesthetics, and session parameters
        </p>
      </div>

      {/* Account Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <User className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
          Active Account Profile
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-1">Full Legal Name</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{user?.name}</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Registered Email</span>
            <span className="font-mono text-slate-900 dark:text-white text-sm">{user?.email}</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Security Role</span>
            <span className="inline-block px-2.5 py-1 rounded font-mono font-bold uppercase text-[11px] bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
              {user?.role}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Account Standing</span>
            <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              Verified & Active
            </span>
          </div>
        </div>
      </div>

      {/* Appearance & Interface Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          {isDark ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
          Interface Aesthetic
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-900 dark:text-white block">
              Color Theme
            </span>
            <p className="text-xs text-slate-500">
              Toggle between high-contrast fintech dark mode and executive light mode
            </p>
          </div>

          <button
            onClick={toggleTheme}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            <span>{isDark ? 'Switch to Light' : 'Switch to Dark'}</span>
          </button>
        </div>
      </div>

      {/* Platform Meta Info */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-500" />
          FinShield Platform Architecture
        </h3>

        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
          <p>
            <strong>FinShield AI</strong> is a full-stack risk detection platform incorporating a deterministic 7-factor explainable scoring heuristic, automated alert queues, multivariate analytics, and granular role authorization.
          </p>
          <p>
            <strong>Version:</strong> 1.0.0-capstone • <strong>Database:</strong> Relational / PostgreSQL Compatible • <strong>Scoring:</strong> Explainable Heuristic Model (0-100)
          </p>
        </div>
      </div>

      {/* Logout Action */}
      <div className="pt-2">
        <button
          onClick={logout}
          className="px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Current Session</span>
        </button>
      </div>
    </div>
  );
};
