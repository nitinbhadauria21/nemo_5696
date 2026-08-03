'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

import NemoWordmark from '@/components/ui/NemoWordmark';

const NICHES = [
  { id: 'ai-tech', label: 'AI & Tech', emoji: '🤖' },
  { id: 'finance', label: 'Finance', emoji: '💰' },
  { id: 'fitness', label: 'Fitness', emoji: '💪' },
  { id: 'food', label: 'Food & Cooking', emoji: '🍳' },
  { id: 'travel', label: 'Travel', emoji: '✈️' },
  { id: 'fashion', label: 'Fashion', emoji: '👗' },
  { id: 'gaming', label: 'Gaming', emoji: '🎮' },
  { id: 'education', label: 'Education', emoji: '📚' },
  { id: 'beauty', label: 'Beauty', emoji: '💄' },
  { id: 'business', label: 'Business', emoji: '📊' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎬' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'health', label: 'Health & Wellness', emoji: '🌿' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'parenting', label: 'Parenting', emoji: '👶' },
  { id: 'pets', label: 'Pets', emoji: '🐾' },
];

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram Reels', icon: '📸', color: 'from-pink-500 to-purple-600' },
  { id: 'youtube', label: 'YouTube Shorts', icon: '▶️', color: 'from-red-500 to-red-600' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', color: 'from-gray-800 to-gray-900' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', color: 'from-blue-600 to-blue-700' },
  { id: 'twitter', label: 'Twitter / X', icon: '𝕏', color: 'from-gray-700 to-gray-900' },
];

const SOCIAL_PLATFORMS = [
  {
    id: 'instagram',
    label: 'Instagram',
    icon: '📸',
    description: 'Connect to track Reels performance',
  },
  { id: 'youtube', label: 'YouTube', icon: '▶️', description: 'Connect to track Shorts & videos' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', description: 'Connect to track viral content' },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: '💼',
    description: 'Connect to track professional content',
  },
  {
    id: 'twitter',
    label: 'Twitter / X',
    icon: '𝕏',
    description: 'Connect to track trending topics',
  },
];

const SCHEDULE_OPTIONS = [
  { id: 'morning', label: 'Morning Creator', time: '7:00 AM – 10:00 AM', emoji: '🌅' },
  { id: 'afternoon', label: 'Afternoon Creator', time: '12:00 PM – 3:00 PM', emoji: '☀️' },
  { id: 'evening', label: 'Evening Creator', time: '6:00 PM – 9:00 PM', emoji: '🌆' },
  { id: 'night', label: 'Night Owl', time: '9:00 PM – 12:00 AM', emoji: '🌙' },
  { id: 'flexible', label: 'Flexible', time: 'Anytime', emoji: '🔄' },
];

const STEPS = ['Niches', 'Platforms', 'Social Connect', 'Schedule'];

export default function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [connectedSocials, setConnectedSocials] = useState<string[]>([]);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<string>('');

  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam) {
      const idx = parseInt(stepParam, 10) - 1;
      if (idx >= 0 && idx < STEPS.length) setStep(idx);
    }
    if (searchParams.get('connected') === '1') {
      const oauth = searchParams.get('oauth');
      if (oauth) setConnectedSocials((prev) => (prev.includes(oauth) ? prev : [...prev, oauth]));
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadSocials() {
      try {
        const res = await fetch('/api/user/connections');
        if (res.ok) {
          const data = await res.json();
          const platforms = (data.connections ?? []).map((c: { platform: string }) => c.platform);
          if (platforms.length) setConnectedSocials(platforms);
        }
      } catch {
        // demo mode
      }
    }
    loadSocials();
  }, []);

  const toggleNiche = (id: string) => {
    setSelectedNiches((prev) => (prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]));
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleConnect = (id: string) => {
    setConnectingId(id);
    window.location.href = `/api/auth/oauth/${id}?returnTo=${encodeURIComponent('/onboarding?step=3&oauth=' + id + '&connected=1')}`;
  };

  const canProceed = () => {
    if (step === 0) return selectedNiches.length > 0;
    if (step === 1) return selectedPlatforms.length > 0;
    if (step === 2) return true; // social can be skipped; connect later in Settings
    if (step === 3) return selectedSchedule !== '';
    return false;
  };

  const handleNext = async () => {
    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }
    try {
      localStorage.setItem(
        'nemo_onboarding',
        JSON.stringify({
          niches: selectedNiches,
          platforms: selectedPlatforms,
          socials: connectedSocials,
          schedule: selectedSchedule,
          complete: true,
        })
      );
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niches: selectedNiches,
          platforms: selectedPlatforms,
          connected_socials: connectedSocials,
          schedule: selectedSchedule,
          onboarding_complete: true,
        }),
      });
      const raw = localStorage.getItem('nemo_local_session');
      if (raw) {
        const session = JSON.parse(raw);
        session.niches = selectedNiches;
        session.platforms = selectedPlatforms;
        session.onboarding_complete = true;
        localStorage.setItem('nemo_local_session', JSON.stringify(session));
      }
    } catch {
      // ignore
    }
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <NemoWordmark size="md" variant="onLight" />
        <span className="text-xs font-sans text-muted-foreground">
          Step {step + 1} of {STEPS.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2 py-5 px-4">
        {STEPS.map((s, i) => (
          <React.Fragment key={`step-${i}`}>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step
                    ? 'bg-primary text-white'
                    : i === step
                      ? 'bg-primary text-white ring-4 ring-primary/20'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {i < step ? <CheckIcon className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={`text-xs font-sans hidden sm:block ${
                  i === step ? 'text-foreground font-semibold' : 'text-muted-foreground'
                }`}
              >
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px max-w-12 ${i < step ? 'bg-primary' : 'bg-border'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-4 pb-8">
        <div className="w-full max-w-2xl">
          {/* Step 0: Niches */}
          {step === 0 && (
            <div>
              <div className="text-center mb-6">
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                  What niches do you create for?
                </h2>
                <p className="text-sm text-muted-foreground font-sans">
                  Select all that apply. We&apos;ll personalise your trend feed.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {NICHES.map((niche) => {
                  const selected = selectedNiches.includes(niche.id);
                  return (
                    <button
                      key={niche.id}
                      onClick={() => toggleNiche(niche.id)}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-150 ${
                        selected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted'
                      }`}
                    >
                      {selected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <CheckIcon className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <span className="text-2xl">{niche.emoji}</span>
                      <span className="text-xs font-sans font-semibold text-center leading-tight">
                        {niche.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              {selectedNiches.length > 0 && (
                <p className="text-center text-xs text-muted-foreground mt-3 font-sans">
                  {selectedNiches.length} niche{selectedNiches.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          )}

          {/* Step 1: Platforms */}
          {step === 1 && (
            <div>
              <div className="text-center mb-6">
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                  Which platforms do you post on?
                </h2>
                <p className="text-sm text-muted-foreground font-sans">
                  Toggle the platforms you actively create content for.
                </p>
              </div>
              <div className="space-y-3">
                {PLATFORMS.map((platform) => {
                  const selected = selectedPlatforms.includes(platform.id);
                  return (
                    <button
                      key={platform.id}
                      onClick={() => togglePlatform(platform.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-150 ${
                        selected
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card hover:border-primary/40 hover:bg-muted'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center text-lg flex-shrink-0`}
                      >
                        {platform.icon}
                      </div>
                      <span className="font-sans font-semibold text-foreground flex-1 text-left">
                        {platform.label}
                      </span>
                      <div
                        className={`w-12 h-6 rounded-full transition-all duration-200 relative ${
                          selected ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
                            selected ? 'left-7' : 'left-1'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Social Connect */}
          {step === 2 && (
            <div>
              <div className="text-center mb-6">
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                  Connect your social accounts
                </h2>
                <p className="text-sm text-muted-foreground font-sans">
                  Connect at least one account for personalised trends — or skip and do this later
                  in Settings.
                </p>
              </div>
              <div className="space-y-3">
                {SOCIAL_PLATFORMS.map((platform) => {
                  const connected = connectedSocials.includes(platform.id);
                  const connecting = connectingId === platform.id;
                  return (
                    <div
                      key={platform.id}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                        connected
                          ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                          : 'border-border bg-card'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl flex-shrink-0">
                        {platform.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans font-semibold text-foreground text-sm">
                          {platform.label}
                        </p>
                        <p className="text-xs text-muted-foreground font-sans">
                          {platform.description}
                        </p>
                      </div>
                      {connected ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                          <CheckIcon className="w-3.5 h-3.5" />
                          Connected
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConnect(platform.id)}
                          disabled={connecting}
                          className="px-4 py-2 rounded-full bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-60 flex items-center gap-1.5"
                        >
                          {connecting ? (
                            <>
                              <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            'Connect'
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {connectedSocials.length === 0 && (
                <p className="text-center text-xs text-muted-foreground mt-3 font-sans">
                  No accounts connected yet — you can skip and connect later.
                </p>
              )}
            </div>
          )}

          {/* Step 3: Schedule */}
          {step === 3 && (
            <div>
              <div className="text-center mb-6">
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                  When do you usually create content?
                </h2>
                <p className="text-sm text-muted-foreground font-sans">
                  We&apos;ll surface trending topics at the right time for you.
                </p>
              </div>
              <div className="space-y-3">
                {SCHEDULE_OPTIONS.map((option) => {
                  const selected = selectedSchedule === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setSelectedSchedule(option.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-150 ${
                        selected
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card hover:border-primary/40 hover:bg-muted'
                      }`}
                    >
                      <span className="text-2xl">{option.emoji}</span>
                      <div className="flex-1 text-left">
                        <p className="font-sans font-semibold text-foreground text-sm">
                          {option.label}
                        </p>
                        <p className="text-xs text-muted-foreground font-sans">{option.time}</p>
                      </div>
                      {selected && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <CheckIcon className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-8 flex items-center justify-between">
            {step > 0 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-5 py-2.5 rounded-full border border-border text-sm font-sans font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {step === 3 ? 'Go to Dashboard' : 'Continue'}
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
