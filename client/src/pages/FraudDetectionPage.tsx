import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FraudRuleConfig, RiskContributor, RiskLevel } from '../types/shared';
import { RiskBadge } from '../components/RiskBadge';
import { 
  ShieldAlert, 
  HelpCircle, 
  Sliders, 
  Play, 
  RotateCcw, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  Zap,
  Info
} from 'lucide-react';

export const FraudDetectionPage: React.FC = () => {
  const [matrix, setMatrix] = useState<{
    factors: {
      id: string;
      name: string;
      maxPoints: number;
      description: string;
      thresholdRule: string;
    }[];
    rules: FraudRuleConfig;
  } | null>(null);

  // Sandbox inputs
  const [sandboxForm, setSandboxForm] = useState({
    amount: '85000',
    merchant: 'Apex Global Crypto OTC',
    category: 'Crypto Exchange',
    location: 'New Delhi',
    paymentMethod: 'wire_transfer',
    deviceId: 'DEV-UNKNOWN-TOR-77',
    timeHour: '02',
    timeMinute: '47',
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    riskScore: number;
    riskLevel: RiskLevel;
    fraudProbability: number;
    explanation: string;
    contributors: RiskContributor[];
    alertTriggered: boolean;
    alertType?: string;
  } | null>(null);

  useEffect(() => {
    const fetchMatrix = async () => {
      try {
        const data = await api.fraud.getMatrix();
        setMatrix(data);
      } catch (err) {
        console.error('Failed to load fraud matrix:', err);
      }
    };
    fetchMatrix();
  }, []);

  const handleRunAnalysis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAnalyzing(true);
    try {
      const now = new Date();
      now.setHours(parseInt(sandboxForm.timeHour, 10), parseInt(sandboxForm.timeMinute, 10), 0);

      const res = await api.fraud.analyze({
        amount: parseFloat(sandboxForm.amount) || 5000,
        merchant: sandboxForm.merchant,
        category: sandboxForm.category,
        location: sandboxForm.location,
        paymentMethod: sandboxForm.paymentMethod,
        deviceId: sandboxForm.deviceId,
        timestamp: now.toISOString(),
      });

      setAnalysisResult(res.analysis);
    } catch (err: any) {
      alert(`Analysis failed: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  // Run initial test on load
  useEffect(() => {
    handleRunAnalysis();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold uppercase tracking-wider mb-2">
          <ShieldAlert className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
          Explainable Heuristics Engine
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Transparent 7-Factor Fraud Engine
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
          FinShield uses an explainable, deterministic weighted heuristic scoring model (0–100 points). Every decision can be audited down to individual mathematical points with generated root-cause explanations.
        </p>
      </div>

      {/* Interactive Sandbox Tester */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Live Scoring Sandbox
              </h2>
              <p className="text-xs text-slate-500">
                Simulate arbitrary transaction payloads and inspect real-time factor weight calculation
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 rounded">
            Interactive Testbed
          </span>
        </div>

        <form onSubmit={handleRunAnalysis} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                value={sandboxForm.amount}
                onChange={e => setSandboxForm({ ...sandboxForm, amount: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Merchant Category
              </label>
              <select
                value={sandboxForm.category}
                onChange={e => setSandboxForm({ ...sandboxForm, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
              >
                <option value="Crypto Exchange">Crypto Exchange (High Risk)</option>
                <option value="Online Gambling">Online Gambling (High Risk)</option>
                <option value="Unregulated Remittance">Unregulated Remittance (High Risk)</option>
                <option value="Shopping">Shopping (Standard)</option>
                <option value="Food">Food & Dining</option>
                <option value="Travel">Travel & Airlines</option>
                <option value="Bills">Bills & Utilities</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Location (City)
              </label>
              <input
                type="text"
                value={sandboxForm.location}
                onChange={e => setSandboxForm({ ...sandboxForm, location: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Time of Day (HH:MM)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={2}
                  value={sandboxForm.timeHour}
                  onChange={e => setSandboxForm({ ...sandboxForm, timeHour: e.target.value })}
                  className="w-16 px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-center text-slate-900 dark:text-white font-mono"
                />
                <span className="text-slate-400">:</span>
                <input
                  type="text"
                  maxLength={2}
                  value={sandboxForm.timeMinute}
                  onChange={e => setSandboxForm({ ...sandboxForm, timeMinute: e.target.value })}
                  className="w-16 px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-center text-slate-900 dark:text-white font-mono"
                />
                <span className="text-[10px] text-slate-400 uppercase">24-hr</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Device Fingerprint
              </label>
              <input
                type="text"
                value={sandboxForm.deviceId}
                onChange={e => setSandboxForm({ ...sandboxForm, deviceId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Rail
              </label>
              <select
                value={sandboxForm.paymentMethod}
                onChange={e => setSandboxForm({ ...sandboxForm, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
              >
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="upi">UPI Instant</option>
                <option value="wire_transfer">Wire Transfer (High Risk)</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex items-end gap-2">
              <button
                type="submit"
                disabled={analyzing}
                className="flex-1 py-2 px-4 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{analyzing ? 'Evaluating...' : 'Execute Fraud Engine Analysis'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSandboxForm({
                    amount: '1250',
                    merchant: 'Swiggy Food Express',
                    category: 'Food',
                    location: 'Mumbai',
                    paymentMethod: 'upi',
                    deviceId: 'DEV-IPHONE-15-KALP',
                    timeHour: '14',
                    timeMinute: '30'
                  });
                }}
                className="py-2 px-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs"
                title="Fill Normal Preset"
              >
                Routine Preset
              </button>

              <button
                type="button"
                onClick={() => {
                  setSandboxForm({
                    amount: '85000',
                    merchant: 'Apex Global Crypto OTC',
                    category: 'Crypto Exchange',
                    location: 'New Delhi',
                    paymentMethod: 'wire_transfer',
                    deviceId: 'DEV-UNKNOWN-TOR-77',
                    timeHour: '02',
                    timeMinute: '47'
                  });
                }}
                className="py-2 px-3 border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 rounded-lg text-xs font-semibold"
                title="Fill Suspicious Preset"
              >
                Attack Preset
              </button>
            </div>
          </div>
        </form>

        {/* Live Evaluation Dossier */}
        {analysisResult && (
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Calculated Risk Score
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                      {analysisResult.riskScore}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">/ 100</span>
                    <RiskBadge level={analysisResult.riskLevel} size="md" />
                  </div>
                </div>

                <div className="border-l border-slate-200 dark:border-slate-700 pl-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Fraud Probability
                  </span>
                  <span className="text-xl font-bold text-slate-900 dark:text-white">
                    {analysisResult.fraudProbability}%
                  </span>
                </div>
              </div>

              {analysisResult.alertTriggered && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 animate-bounce" />
                  <span>Automated Alert Escalated: {analysisResult.alertType}</span>
                </div>
              )}
            </div>

            {/* Dynamic Generated Explanation */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block mb-1">
                Synthesized Natural Language Explanation:
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
                "{analysisResult.explanation}"
              </p>
            </div>

            {/* Contributing Factor Progress Bars */}
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Active Contributing Factors Breakdown:
              </p>
              {analysisResult.contributors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysisResult.contributors.map(c => (
                    <div key={c.factor} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-900 dark:text-white">{c.label}</span>
                        <span className="font-mono text-slate-500">
                          {c.score} / {c.maxScore} pts ({c.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            c.percentage >= 80 ? 'bg-rose-500' : c.percentage >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${c.percentage}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{c.reason}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                  Clean transaction. 0 risk factors triggered.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 7 Factors Architectural Reference Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          7-Factor Scoring Matrix Specification
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Deterministic weighting distribution totaling 100 points maximum
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matrix?.factors.map(f => (
            <div key={f.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">{f.name}</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                  Max {f.maxPoints} pts
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {f.description}
              </p>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/50 text-[11px]">
                <span className="text-slate-400">Threshold Trigger: </span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{f.thresholdRule}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
