'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface ProfileFormData {
  name: string;
  email: string;
  timezone: string;
  bio: string;
}

const TIMEZONES = [
  'Asia/Kolkata (IST)',
  'America/New_York (EST)',
  'America/Los_Angeles (PST)',
  'Europe/London (GMT)',
  'Asia/Singapore (SGT)',
];

export default function ProfileTab() {
  const { profile, user, refreshProfile, loading } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: '',
      email: '',
      timezone: 'Asia/Kolkata (IST)',
      bio: '',
    },
  });

  useEffect(() => {
    if (loading) return;
    const name =
      profile?.full_name?.trim() ||
      (user?.user_metadata?.full_name as string | undefined)?.trim() ||
      '';
    const email = profile?.email || user?.email || '';
    reset({
      name,
      email,
      timezone: 'Asia/Kolkata (IST)',
      bio: '',
    });
    setReady(true);
  }, [profile, user, loading, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: data.name.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save');
      }
      await refreshProfile();
      setSaved(true);
      toast.success('Profile saved');
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = profile?.full_name || user?.email || '?';
  const initial = displayName.trim().charAt(0).toUpperCase() || '?';

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Loading profile…</p>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="card-surface p-5">
        <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-4">
          Profile Photo
        </h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flame-gradient flex items-center justify-center flex-shrink-0">
            <span className="text-white text-2xl font-display font-bold">{initial}</span>
          </div>
          <div>
            <p className="text-sm font-sans font-semibold text-foreground">{displayName}</p>
            <p className="text-xs text-muted-foreground font-sans mt-0.5 capitalize">
              {profile?.plan || 'free'} plan
            </p>
          </div>
        </div>
      </div>

      <div className="card-surface p-5">
        <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-4">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-sans font-medium text-foreground mb-1.5">
              Full name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              {...register('name', { required: 'Name is required' })}
              className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-sans font-medium text-foreground mb-1.5">
              Email address
            </label>
            <input
              type="email"
              {...register('email')}
              readOnly
              className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground/70 focus:outline-none cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Email is managed by your login account
            </p>
          </div>

          <div>
            <label className="block text-sm font-sans font-medium text-foreground mb-1.5">
              Timezone
            </label>
            <select
              {...register('timezone')}
              className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {TIMEZONES.map((tz) => (
                <option key={`tz-${tz}`} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-sans font-medium text-foreground mb-1.5">
              Bio
            </label>
            <textarea
              {...register('bio')}
              rows={3}
              placeholder="Optional — tell creators what you make"
              className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border">
        <p className="text-xs text-muted-foreground font-sans">
          {saved ? (
            <span className="text-accent font-semibold">✓ Profile saved</span>
          ) : (
            'Changes sync to your Nemo profile'
          )}
        </p>
        <button
          type="submit"
          disabled={isSaving}
          className="btn-flame px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-70"
        >
          {isSaving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Profile'}
        </button>
      </div>

      <DangerZone />
    </form>
  );
}

function DangerZone() {
  const { signOut } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const onDelete = async () => {
    if (confirmText !== 'DELETE') {
      toast.error('Type DELETE to confirm');
      return;
    }
    if (!window.confirm('Permanently delete your account and all data? This cannot be undone.')) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch('/api/user/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE' }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || 'Delete failed');
      }
      toast.success('Account deleted');
      await signOut();
      window.location.href = '/';
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="card-surface p-5 border border-red-500/30">
      <h3 className="text-xs font-mono-custom uppercase tracking-widest text-red-500 mb-2">
        Danger zone
      </h3>
      <p className="text-sm text-muted-foreground font-sans mb-4">
        Permanently delete your account, profile, scripts, bookmarks, and analytics. This cannot be
        undone.
      </p>
      <label className="block text-sm font-sans font-medium text-foreground mb-1.5">
        Type DELETE to confirm
      </label>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="flex-1 bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          autoComplete="off"
        />
        <button
          type="button"
          disabled={deleting || confirmText !== 'DELETE'}
          onClick={onDelete}
          className="px-6 py-2.5 text-sm rounded-xl bg-red-600 text-white font-semibold disabled:opacity-50"
        >
          {deleting ? 'Deleting…' : 'Delete account'}
        </button>
      </div>
    </div>
  );
}
