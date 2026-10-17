import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  X,
  ShieldCheck,
  UserCheck,
  Lock,
  User,
  KeyRound,
} from 'lucide-react';

export default function LoginModal({ isOpen, onClose }) {
  const { login } = useAuth();
  const { addToast } = useToast();

  const [username, setUsername] = useState('Ishleen');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const user = await login(username.trim(), password);
      addToast(
        `Logged in successfully as ${user.full_name} (${user.role})`,
        'success'
      );
      onClose();
    } catch (err) {
      addToast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleUser, rolePass) => {
    setUsername(roleUser);
    setPassword(rolePass);
  };

  const adminSelected = username === 'Ishleen';
  const agentSelected = username === 'agent';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition"
          aria-label="Close login modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 id="login-title" className="text-xl font-bold text-slate-900">
              Staff Portal Login
            </h2>
            <p className="text-xs text-slate-500">
              Role-Based Access Control
            </p>
          </div>
        </div>

        <div className="mb-6 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
            Quick Login
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('Ishleen', 'Ishleen@123')}
              className={`p-2 rounded-lg border text-left text-xs transition flex items-center gap-2 ${
                adminSelected
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-semibold shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">Store Admin</p>
                <p className="text-[10px] text-slate-400">Full administrative access</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('agent', 'agent123')}
              className={`p-2 rounded-lg border text-left text-xs transition flex items-center gap-2 ${
                agentSelected
                  ? 'bg-teal-50 border-teal-500 text-teal-700 font-semibold shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-teal-300'
              }`}
            >
              <UserCheck className="w-4 h-4 text-teal-600 shrink-0" />
              <div>
                <p className="font-bold">Support Agent</p>
                <p className="text-[10px] text-slate-400">Approvals and actions</p>
              </div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="staff-username" className="block text-xs font-semibold text-slate-700 mb-1">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                id="staff-username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                placeholder="Enter your username"
              />
            </div>
          </div>

          <div>
            <label htmlFor="staff-password" className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                id="staff-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}