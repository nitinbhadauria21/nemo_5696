'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';

const NICHES = [
  'AI & Tech',
  'Marketing',
  'Gaming',
  'Sports',
  'Finance',
  'Business',
  'Productivity',
  'Health',
  'Entertainment',
  'Education',
  'Travel',
  'Food',
];

const TONES = ['Educational', 'Entertaining', 'Inspirational', 'Controversial', 'Authentic'];

export default function StyleDefaultsTab() {
  const [selectedNiches, setSelectedNiches] = useState<string[]>(['AI & Tech', 'Marketing']);
  const [selectedTone, setSelectedTone] = useState('Authentic');
  const [isSaving, setIsSaving] = useState(false);

  const toggleNiche = (niche: string) => {
    setSelectedNiches((prev) =>
      prev.includes(niche)
        ? prev.filter((n) => n !== niche)
        : prev.length < 3
          ? [...prev, niche]
          : prev
    );
  };

  const handleSave = () => {
    // BACKEND INTEGRATION: PATCH /api/user/style-defaults
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Style preferences saved');
    }, 900);
  };

  return (
    <div className="space-y-5">
      <div className="card-surface p-5">
        <h3 className="text-sm font-sans font-semibold text-foreground mb-1">Content Niches</h3>
        <p className="text-xs text-muted-foreground font-sans mb-4">
          Select up to 3 niches — NEMO will prioritize these in your dashboard and AI analysis.
          <span className="ml-1 text-primary font-semibold">
            {selectedNiches.length}/3 selected
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {NICHES.map((niche) => {
            const active = selectedNiches.includes(niche);
            const atMax = selectedNiches.length >= 3 && !active;
            return (
              <button
                key={`niche-${niche}`}
                onClick={() => toggleNiche(niche)}
                disabled={atMax}
                className={`px-3 py-1.5 rounded-full text-sm font-sans font-medium transition-all duration-150 ${
                  active
                    ? 'bg-primary text-white shadow-flame-sm'
                    : atMax
                      ? 'bg-muted text-muted-foreground/40 cursor-not-allowed border border-border'
                      : 'bg-muted text-muted-foreground hover:text-foreground border border-border'
                }`}
              >
                {niche}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card-surface p-5">
        <h3 className="text-sm font-sans font-semibold text-foreground mb-1">Content Tone</h3>
        <p className="text-xs text-muted-foreground font-sans mb-4">
          Your default tone influences AI-generated content angles and script suggestions.
        </p>
        <div className="flex flex-wrap gap-2">
          {TONES.map((tone) => (
            <button
              key={`tone-${tone}`}
              onClick={() => setSelectedTone(tone)}
              className={`px-4 py-2 rounded-full text-sm font-sans font-medium transition-all duration-150 border ${
                selectedTone === tone
                  ? 'bg-secondary/10 text-secondary border-secondary/30'
                  : 'bg-muted text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              {tone}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-flame px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-70"
        >
          {isSaving ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : null}
          {isSaving ? 'Saving…' : 'Save Style Defaults'}
        </button>
      </div>
    </div>
  );
}
