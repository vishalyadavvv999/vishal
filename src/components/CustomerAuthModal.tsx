import { useState } from 'react';
import { Lock, UserPlus, X } from 'lucide-react';
import type { CustomerUser } from '../types';
import { api } from '../lib/api';

interface CustomerAuthModalProps {
  open: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onAuthenticated: (customer: CustomerUser) => void;
}

export function CustomerAuthModal({
  open,
  initialMode = 'login',
  onClose,
  onAuthenticated,
}: CustomerAuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res =
        mode === 'register'
          ? await api.customerRegister({
              name: name.trim(),
              email: email.trim(),
              password,
            })
          : await api.customerLogin({
              email: email.trim(),
              password,
            });
      onAuthenticated(res.customer);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#07111E]/75 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-auth-title"
    >
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 bg-[#0B192C] text-white flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#DFC166]">
              Reader Account
            </p>
            <h2 id="customer-auth-title" className="font-serif text-lg font-bold">
              {mode === 'login' ? 'Sign In to Review' : 'Create Reader Account'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close reader authentication dialog"
            className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Segmented Mode Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 border border-slate-200 rounded-md">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`py-2 text-xs font-semibold rounded transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#0B192C] text-white'
                  : 'text-slate-600 hover:text-[#0B192C]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`py-2 text-xs font-semibold rounded transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#0B192C] text-white'
                  : 'text-slate-600 hover:text-[#0B192C]'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your display name for reviews"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="reader@example.com"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password * {mode === 'register' ? '(min 8 characters)' : ''}
              </label>
              <input
                type="password"
                required
                minLength={8}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-[#0B192C] text-white text-sm font-semibold rounded-md hover:bg-[#132642] transition-colors disabled:opacity-60 cursor-pointer"
            >
              {mode === 'register' ? (
                <UserPlus className="w-4 h-4 text-[#DFC166]" />
              ) : (
                <Lock className="w-4 h-4 text-[#DFC166]" />
              )}
              <span>
                {loading
                  ? 'Please wait...'
                  : mode === 'register'
                    ? 'Create Account & Continue'
                    : 'Sign In & Continue'}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
