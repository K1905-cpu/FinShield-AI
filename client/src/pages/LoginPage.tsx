import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Loader2, 
  Lock, 
  Mail, 
  UserCheck, 
  AlertCircle 
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill from demo param if provided
  useEffect(() => {
    const demoEmail = searchParams.get('demo');
    if (demoEmail) {
      if (demoEmail.includes('admin')) {
        setEmail('admin@finshield.ai');
        setPassword('Admin@123');
      } else if (demoEmail.includes('analyst')) {
        setEmail('analyst@finshield.ai');
        setPassword('Analyst@123');
      } else {
        setEmail('user@finshield.ai');
        setPassword('User@123');
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (role: 'admin' | 'analyst' | 'user') => {
    if (role === 'admin') {
      setEmail('admin@finshield.ai');
      setPassword('Admin@123');
    } else if (role === 'analyst') {
      setEmail('analyst@finshield.ai');
      setPassword('Analyst@123');
    } else {
      setEmail('user@finshield.ai');
      setPassword('User@123');
    }
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-zinc-800 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-2">
          <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-emerald-400 shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="text-left">
            <span className="text-xl font-bold tracking-tight text-white block">
              FinShield
            </span>
            <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-emerald-500">
              Risk Intelligence Core
            </span>
          </div>
        </Link>
        <p className="text-xs text-slate-400 font-normal mt-1">
          Institutional fraud & risk detection terminal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/90 border border-slate-800/80 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          <h2 className="text-base font-bold text-white mb-6">
            Sign In to Security Terminal
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@finshield.ai"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-zinc-900 focus:ring-zinc-600 mr-2"
                />
                Remember session
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>

          {/* Demo Credentials Chips */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              1-Click Demonstration Access:
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setDemoCredentials('admin')}
                className="w-full p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between text-left transition-colors"
              >
                <div>
                  <span className="text-xs font-bold text-rose-400 block">Admin Demo</span>
                  <span className="text-[11px] text-slate-400 font-mono">admin@finshield.ai / Admin@123</span>
                </div>
                <span className="text-[10px] text-zinc-300 font-semibold bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded">
                  Autofill
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('analyst')}
                className="w-full p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between text-left transition-colors"
              >
                <div>
                  <span className="text-xs font-bold text-amber-400 block">Analyst Demo</span>
                  <span className="text-[11px] text-slate-400 font-mono">analyst@finshield.ai / Analyst@123</span>
                </div>
                <span className="text-[10px] text-zinc-300 font-semibold bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded">
                  Autofill
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('user')}
                className="w-full p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between text-left transition-colors"
              >
                <div>
                  <span className="text-xs font-bold text-emerald-400 block">User Demo (Kalp Shah)</span>
                  <span className="text-[11px] text-slate-400 font-mono">user@finshield.ai / User@123</span>
                </div>
                <span className="text-[10px] text-zinc-300 font-semibold bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded">
                  Autofill
                </span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Need a student user account?{' '}
            <Link to="/register" className="text-zinc-200 hover:text-white underline underline-offset-4 font-semibold">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
