import { useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import type { AdminUser } from '../../types';
import { api } from '../../lib/api';

interface AdminLoginProps {
  onLoginSuccess: (admin: AdminUser) => void;
  onBackToStore: () => void;
}

export function AdminLogin({ onLoginSuccess, onBackToStore }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.adminLogin(email.trim(), password);
      onLoginSuccess(res.admin);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] bg-[#F9FAFB] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-[#0B192C] px-6 py-6 text-white space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#DFC166]">
            <ShieldCheck className="w-4 h-4" />
            <span>Publisher Owner Portal</span>
          </div>
          <h1 className="font-serif text-2xl font-bold">Admin Sign In</h1>
          <p className="text-xs text-slate-300">
            Manage catalog titles, cover uploads, private PDFs, orders, and payment configuration.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Admin Email *
            </label>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@bhagwatipublications.com"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-[#0B192C] text-white text-sm font-semibold rounded-md hover:bg-[#132642] transition-colors disabled:opacity-60 cursor-pointer"
          >
            <Lock className="w-4 h-4 text-[#DFC166]" />
            <span>{loading ? 'Verifying...' : 'Sign In to Admin Panel'}</span>
          </button>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <button
              type="button"
              onClick={onBackToStore}
              className="hover:text-[#0B192C] underline underline-offset-2 cursor-pointer"
            >
              Return to Storefront
            </button>
            <span>Configured via .env</span>
          </div>
        </form>
      </div>
    </div>
  );
}
