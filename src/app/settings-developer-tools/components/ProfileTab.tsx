'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface ProfileFormData {
  name: string;
  username: string;
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
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
    defaultValues: {
      name: 'Nitin Sharma',
      username: 'nitin_creates',
      email: 'nitin@studio.in',
      timezone: 'Asia/Kolkata (IST)',
      bio: 'Content strategist & AI tools enthusiast. Building at the intersection of tech and creativity.',
    },
  });

  const onSubmit = (_data: ProfileFormData) => {
    // BACKEND INTEGRATION: PATCH /api/user/profile
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      toast.success('Profile saved successfully');
      setTimeout(() => setSaved(false), 3000);
    }, 1200);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar section */}
      <div className="card-surface p-5">
        <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground mb-4">
          Profile Photo
        </h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flame-gradient flex items-center justify-center flex-shrink-0">
            <span className="text-white text-2xl font-display font-bold">N</span>
          </div>
          <div>
            <button type="button" className="text-sm font-sans font-semibold text-primary hover:underline">
              Upload new photo
            </button>
            <p className="text-xs text-muted-foreground font-sans mt-0.5">
              JPG, PNG or GIF · Max 2MB · Recommended 256×256px
            </p>
          </div>
        </div>
      </div>

      {/* Basic info */}
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
              Username
            </label>
            <p className="text-xs text-muted-foreground font-sans mb-1.5">
              Used in your public NEMO profile URL
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono-custom text-muted-foreground">@</span>
              <input
                type="text"
                {...register('username')}
                className="w-full bg-input border border-border rounded-xl px-4 py-2.5 pl-7 text-sm font-mono-custom text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-sans font-medium text-foreground mb-1.5">
              Email address
            </label>
            <input
              type="email"
              {...register('email', { required: 'Email required' })}
              className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
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
                <option key={`tz-${tz}`} value={tz}>{tz}</option>
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
              className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border">
        <p className="text-xs text-muted-foreground font-sans">
          {saved ? (
            <span className="text-accent font-semibold">✓ Profile saved</span>
          ) : (
            'Unsaved changes will be lost if you navigate away'
          )}
        </p>
        <button
          type="submit"
          disabled={isSaving}
          className="btn-flame px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-70"
        >
          {isSaving ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : null}
          {isSaving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
}