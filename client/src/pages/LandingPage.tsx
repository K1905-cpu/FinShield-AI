import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  ArrowRight, 
  Activity, 
  AlertTriangle, 
  Search, 
  FileSpreadsheet, 
  PieChart, 
  Check, 
  Lock, 
  Sliders 
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleDemoLogin = (email: string) => {
    navigate(`/login?demo=${encodeURIComponent(email)}`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-slate-700 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white text-slate-900 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              FinShield
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => handleDemoLogin('admin@finshield.ai')}
              className="text-xs font-semibold bg-white hover:bg-slate-100 text-slate-900 px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>Explore Platform</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium mb-8">
          <span>Enterprise Transaction Security & Anomaly Detection</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-3xl mx-auto">
          Intelligent protection for every transaction.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          FinShield detects suspicious financial behavior, evaluates multi-factor transaction risk, and empowers risk analysts with explainable decision heuristics.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => handleDemoLogin('admin@finshield.ai')}
            className="px-5 py-2.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm"
          >
            <span>Launch Admin Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors"
          >
            Sign In with Password
          </button>
        </div>

        {/* Quick Demo Access Bar */}
        <div className="mt-14 p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 max-w-xl mx-auto text-left">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
            Instant Role Preview Accounts:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => handleDemoLogin('admin@finshield.ai')}
              className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-colors"
            >
              <span className="text-xs font-semibold text-white block">Administrator</span>
              <span className="text-[11px] text-slate-400 truncate block">admin@finshield.ai</span>
            </button>

            <button
              onClick={() => handleDemoLogin('analyst@finshield.ai')}
              className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-colors"
            >
              <span className="text-xs font-semibold text-white block">Risk Analyst</span>
              <span className="text-[11px] text-slate-400 truncate block">analyst@finshield.ai</span>
            </button>

            <button
              onClick={() => handleDemoLogin('user@finshield.ai')}
              className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-colors"
            >
              <span className="text-xs font-semibold text-white block">Cardholder</span>
              <span className="text-[11px] text-slate-400 truncate block">user@finshield.ai</span>
            </button>
          </div>
        </div>
      </section>

      {/* Architecture Flow Section */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-slate-800">
        <div className="text-center mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            How The Detection Pipeline Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl mx-auto">
            From ingestion to decision: a transparent 6-stage heuristic evaluation pipeline
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5">
          {[
            { step: '01', title: 'Transaction', desc: 'Real-time telemetry ingestion' },
            { step: '02', title: 'Risk Analysis', desc: 'Baseline comparison model' },
            { step: '03', title: 'Indicators', desc: '7 weighted factor detectors' },
            { step: '04', title: 'Risk Score', desc: 'Normalized 0-100 score' },
            { step: '05', title: 'Alerts', desc: 'Automated compliance triage' },
            { step: '06', title: 'Investigation', desc: 'Analyst action & audit log' },
          ].map((item) => (
            <div 
              key={item.title} 
              className="bg-slate-800/40 border border-slate-800 rounded-xl p-3.5 text-left"
            >
              <span className="text-[10px] font-mono text-slate-500 font-bold block mb-1">
                {item.step}
              </span>
              <h4 className="text-xs font-semibold text-white">{item.title}</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Capabilities Grid */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-slate-800">
        <div className="text-center mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Platform Capabilities
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Engineered for transparency, auditability, and speed
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: '7-Factor Anomaly Scoring',
              desc: 'Deterministic evaluation across transaction amount, velocity spurts, geolocation drift, nocturnal hours, merchant risk, device footprints, and category baseline shifts.',
            },
            {
              title: 'Explainable AI Breakdown',
              desc: 'Every alert provides an exact factor point contribution and a synthesized natural language explanation so compliance teams can defend decisions.',
            },
            {
              title: 'Multivariate Analytics',
              desc: 'Explore 24-hour attack curves, high-risk merchant domains, geographical hotspots, and payment rail vulnerability metrics.',
            },
            {
              title: 'Triage & Alert Workflows',
              desc: 'Flagged transactions route automatically to the alert queue where analysts can confirm fraud, mark under review, or dismiss false positives.',
            },
            {
              title: 'Personal Finance Intelligence',
              desc: 'Cardholders access personal dashboards with monthly spend trajectories, category budgets, and personalized financial insights.',
            },
            {
              title: 'Batch Manifest Processing',
              desc: 'Bulk upload transaction CSV files with instant schema validation and automatic execution through the scoring engine.',
            },
          ].map(feature => (
            <div 
              key={feature.title}
              className="bg-slate-800/40 border border-slate-800 rounded-xl p-5 space-y-2 hover:border-slate-700 transition-colors"
            >
              <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 px-4 text-center text-xs text-slate-500">
        <p className="font-medium text-slate-400">FinShield • Financial Fraud & Risk Detection Platform</p>
      </footer>
    </div>
  );
};
