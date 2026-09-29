import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FraudRuleConfig } from '../types/shared';
import { Sliders, Save, CheckCircle2, Shield, RefreshCw, AlertCircle } from 'lucide-react';

export const FraudRulesPage: React.FC = () => {
  const [rules, setRules] = useState<FraudRuleConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getRules();
      setRules(res.rules);
    } catch (err) {
      console.error('Failed to load rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rules) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await api.admin.updateRules(rules);
      setRules(res.rules);
      setMessage('Fraud engine configuration updated and actively enforced!');
    } catch (err: any) {
      alert(`Failed to save rules: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !rules) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold uppercase tracking-wider mb-2">
          <Shield className="w-3.5 h-3.5" />
          Admin Engine Configuration
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Sliders className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
          Fraud Rules & Weight Calibration
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Adjust systemic heuristic thresholds, velocity windows, and factor point distributions in real-time
        </p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Detection Thresholds */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            Anomaly Threshold Boundaries
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                High-Value Anomaly Limit (₹)
              </label>
              <input
                type="number"
                value={rules.highValueThreshold}
                onChange={e => setRules({ ...rules, highValueThreshold: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Automatic critical amount flag</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Velocity Window (Minutes)
              </label>
              <input
                type="number"
                value={rules.velocityWindowMinutes}
                onChange={e => setRules({ ...rules, velocityWindowMinutes: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Rolling minutes timeframe</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Velocity Transaction Count Limit
              </label>
              <input
                type="number"
                value={rules.velocityCountThreshold}
                onChange={e => setRules({ ...rules, velocityCountThreshold: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Max allowable swipes in window</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unusual Hours (24-hr Window)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={rules.unusualHoursStart}
                  onChange={e => setRules({ ...rules, unusualHoursStart: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-center text-slate-900 dark:text-white"
                />
                <span className="text-slate-400 text-xs">to</span>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={rules.unusualHoursEnd}
                  onChange={e => setRules({ ...rules, unusualHoursEnd: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-center text-slate-900 dark:text-white"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">e.g. 1 AM to 5 AM nocturnal period</span>
            </div>
          </div>
        </div>

        {/* 7 Factor Point Weight Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Factor Weight Distribution (Totaling 100 Points)
              </h3>
              <p className="text-xs text-slate-500">
                Sum of all factor weights: {
                  Object.values(rules.weights).reduce((a, b) => a + b, 0)
                } / 100 pts
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount Anomaly Weight
              </label>
              <input
                type="number"
                value={rules.weights.amountAnomaly}
                onChange={e => setRules({
                  ...rules,
                  weights: { ...rules.weights, amountAnomaly: parseInt(e.target.value, 10) || 0 }
                })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Velocity Anomaly Weight
              </label>
              <input
                type="number"
                value={rules.weights.frequencyAnomaly}
                onChange={e => setRules({
                  ...rules,
                  weights: { ...rules.weights, frequencyAnomaly: parseInt(e.target.value, 10) || 0 }
                })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Location Anomaly Weight
              </label>
              <input
                type="number"
                value={rules.weights.locationAnomaly}
                onChange={e => setRules({
                  ...rules,
                  weights: { ...rules.weights, locationAnomaly: parseInt(e.target.value, 10) || 0 }
                })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Time Anomaly Weight
              </label>
              <input
                type="number"
                value={rules.weights.timeAnomaly}
                onChange={e => setRules({
                  ...rules,
                  weights: { ...rules.weights, timeAnomaly: parseInt(e.target.value, 10) || 0 }
                })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Merchant Risk Weight
              </label>
              <input
                type="number"
                value={rules.weights.merchantRisk}
                onChange={e => setRules({
                  ...rules,
                  weights: { ...rules.weights, merchantRisk: parseInt(e.target.value, 10) || 0 }
                })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Device Anomaly Weight
              </label>
              <input
                type="number"
                value={rules.weights.deviceAnomaly}
                onChange={e => setRules({
                  ...rules,
                  weights: { ...rules.weights, deviceAnomaly: parseInt(e.target.value, 10) || 0 }
                })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Behavioral Anomaly Weight
              </label>
              <input
                type="number"
                value={rules.weights.behavioralAnomaly}
                onChange={e => setRules({
                  ...rules,
                  weights: { ...rules.weights, behavioralAnomaly: parseInt(e.target.value, 10) || 0 }
                })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* High Risk Merchant Categories */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            High-Risk Merchant Categories
          </h3>
          <p className="text-xs text-slate-500">
            Comma-separated categories that trigger automatic merchant risk points
          </p>

          <input
            type="text"
            value={rules.highRiskMerchantCategories.join(', ')}
            onChange={e => setRules({
              ...rules,
              highRiskMerchantCategories: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
            })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Persisting to Database...' : 'Save & Enforce Rules'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
