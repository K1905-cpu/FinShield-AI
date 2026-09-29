import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, UserRole } from '../types/shared';
import { RiskBadge } from '../components/RiskBadge';
import { Users, Shield, RefreshCw, CheckCircle, Ban, AlertCircle } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getUsers();
      setUsers(res.users);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingId(userId);
    try {
      await api.admin.updateRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      alert(`Failed to update user role: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: 'active' | 'suspended') => {
    setUpdatingId(userId);
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.admin.updateStatus(userId, nextStatus);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
    } catch (err: any) {
      alert(`Failed to update account status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" />
            Admin Privileged Space
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
            User Management & Role Elevation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage system identities, configure authorization tiers, and suspend malicious accounts
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3">Account</th>
                <th className="px-5 py-3">User ID</th>
                <th className="px-5 py-3">Role Tier</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Txn Count</th>
                <th className="px-5 py-3">Risk Level</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-slate-900 dark:text-white block">{u.name}</span>
                    <span className="text-slate-500 text-[11px]">{u.email}</span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-500">{u.id}</td>
                  <td className="px-5 py-3.5">
                    <select
                      value={u.role}
                      disabled={updatingId === u.id}
                      onChange={e => handleRoleChange(u.id, e.target.value as UserRole)}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold uppercase"
                    >
                      <option value="admin">ADMIN</option>
                      <option value="analyst">ANALYST</option>
                      <option value="user">USER</option>
                    </select>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      u.status === 'active' 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                    {u.transactionCount || 0}
                  </td>
                  <td className="px-5 py-3.5">
                    <RiskBadge level={u.riskLevel || 'LOW'} size="sm" />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleStatusToggle(u.id, u.status)}
                      disabled={updatingId === u.id}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        u.status === 'active'
                          ? 'border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
                          : 'border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                    >
                      {u.status === 'active' ? 'Suspend Account' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
