'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ShieldAlert, Eye, EyeOff } from 'lucide-react';
import AdminKPICards from './AdminKPICards';
import SystemHealthPanel from './SystemHealthPanel';
import AdminUsersTable from './AdminUsersTable';

interface AdminLoginForm {
  email: string;
  code: string;
}

export default function AdminPanelContent() {
  const [authenticated, setAuthenticated] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, setError } = useForm<AdminLoginForm>();

  const handleAdminLogin = (data: AdminLoginForm) => {
    // BACKEND INTEGRATION: POST /api/admin/login
    if (data.code !== 'NEMO_MASTER_2026_NITIN' || data.email !== 'admin@nemo.app') {
      setError('code', { message: 'Invalid credentials — use the demo admin account' });
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setAuthenticated(true);
      toast.success('Admin access granted · 24h session');
    }, 1200);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="card-surface p-8 border-red-500/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <ShieldAlert size={20} className="text-red-400" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-foreground">Admin Access</h1>
                <p className="text-xs text-muted-foreground font-sans">Restricted area · NEMO Platform</p>
              </div>
            </div>

            <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl mb-6">
              <p className="text-xs font-sans text-red-400 leading-relaxed">
                This area is restricted to authorized administrators only. Unauthorized access attempts are logged.
              </p>
            </div>

            <form onSubmit={handleSubmit(handleAdminLogin)} className="space-y-4">
              <div>
                <label className="block text-sm font-sans font-medium text-foreground mb-1.5">
                  Admin email
                </label>
                <input
                  type="email"
                  placeholder="admin@nemo.app"
                  {...register('email', { required: 'Email required' })}
                  className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-sans font-medium text-foreground mb-1.5">
                  Master admin code
                </label>
                <p className="text-xs text-muted-foreground font-sans mb-1.5">
                  24-character master passcode — provided to platform administrators only
                </p>
                <div className="relative">
                  <input
                    type={showCode ? 'text' : 'password'}
                    placeholder="NEMO_MASTER_…"
                    {...register('code', { required: 'Master code required' })}
                    className="w-full bg-input border border-border rounded-xl px-4 py-2.5 pr-10 text-sm font-mono-custom text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCode((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showCode ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.code && (
                  <p className="mt-1 text-xs text-red-400">{errors.code.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-display font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoading ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  'Enter Admin Panel →'
                )}
              </button>
            </form>

            {/* Demo credentials */}
            <div className="mt-5 p-3 bg-muted rounded-xl border border-border">
              <p className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-2">
                Demo Admin Credentials
              </p>
              <div className="space-y-1">
                <p className="text-xs font-sans text-muted-foreground">
                  Email: <span className="font-mono-custom text-foreground">admin@nemo.app</span>
                </p>
                <p className="text-xs font-sans text-muted-foreground">
                  Code: <span className="font-mono-custom text-foreground">NEMO_MASTER_2026_NITIN</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center">
            <ShieldAlert size={14} className="text-red-400" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">Admin Panel</h1>
          <span className="text-xs font-mono-custom bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
            RESTRICTED
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-sans">
            Session expires in <span className="font-mono-custom text-foreground">23:42:18</span>
          </span>
          <button
            onClick={() => {
              setAuthenticated(false);
              toast('Admin session ended');
            }}
            className="text-xs font-sans font-semibold text-red-400 hover:text-red-300 px-3 py-1.5 rounded-full border border-red-500/20 hover:bg-red-500/10 transition-all"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="px-6 py-5 max-w-screen-2xl mx-auto space-y-5">
        <AdminKPICards />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2">
            <AdminUsersTable />
          </div>
          <div>
            <SystemHealthPanel />
          </div>
        </div>

        {/* Moderation queue */}
        <div className="card-surface p-5">
          <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-4">
            Moderation Queue
          </h3>
          <div className="space-y-2">
            {[
              { id: 'mod-001', type: 'Reported Trend', subject: 'Misleading health claims — "Miracle Weight Loss 2026"', priority: 'high', time: '14m ago' },
              { id: 'mod-002', type: 'Spam Report', subject: 'Repeated keyword stuffing in bookmark labels', priority: 'medium', time: '1h ago' },
              { id: 'mod-003', type: 'API Abuse', subject: 'Rate limit exceeded 40× in 10 min — key NT_test_2f9c', priority: 'high', time: '2h ago' },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-xl border border-border">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`flex-shrink-0 w-2 h-2 rounded-full ${item.priority === 'high' ? 'bg-red-400' : 'bg-secondary'}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-mono-custom text-muted-foreground uppercase tracking-wide">{item.type}</p>
                    <p className="text-sm font-sans text-foreground truncate">{item.subject}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-sans text-muted-foreground">{item.time}</span>
                  <button className="text-xs font-sans font-semibold text-primary hover:underline">Review</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}