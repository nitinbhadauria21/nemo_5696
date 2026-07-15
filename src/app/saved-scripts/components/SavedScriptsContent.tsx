'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Icon from '@/components/ui/AppIcon';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScriptVersion {
  id: string;
  style: string;
  styleLabel: string;
  hook: string;
  body: string;
  cta: string;
  viralScore: number;
  timestamps: string[];
  deliveryNotes: string;
}

interface SavedScript {
  id: string;
  topic: string;
  platform: string;
  niche: string;
  versions: ScriptVersion[];
  generatedAt: string;
  selected?: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_SCRIPTS: SavedScript[] = [
  {
    id: 'script-1',
    topic: 'Why I quit my 9-to-5 to build a business',
    platform: 'YouTube Shorts',
    niche: 'Business',
    generatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    versions: [
      {
        id: 'v1', style: 'bold', styleLabel: 'Bold & Provocative',
        hook: 'I made more in 30 days than my entire year salary — here\'s exactly how.',
        body: 'Most people think you need years of experience to quit your job. Wrong. I had 3 months of savings and a laptop. The secret? I stopped trading time for money and started building systems. First month: $0. Second month: $2k. Third month: $8k. Here\'s the exact playbook I used...',
        cta: 'Follow for the full breakdown — I\'m posting every step of my journey.',
        viralScore: 91,
        timestamps: ['0:00 - Hook', '0:05 - Credibility', '0:20 - The system', '0:50 - CTA'],
        deliveryNotes: 'Speak fast and confident. Pause after the salary reveal. Use hand gestures when listing months.',
      },
      {
        id: 'v2', style: 'balanced', styleLabel: 'Balanced & Informative',
        hook: '3 things I wish I knew before quitting my job to start a business.',
        body: 'After 5 years in corporate, I took the leap. Here\'s what nobody tells you: 1. Your first idea will probably fail — and that\'s fine. 2. Consistency beats talent every single time. 3. Your network is your net worth. I built mine from zero...',
        cta: 'Save this for when you\'re ready to make the jump. What\'s stopping you?',
        viralScore: 84,
        timestamps: ['0:00 - Hook', '0:08 - Point 1', '0:25 - Point 2', '0:40 - Point 3', '0:55 - CTA'],
        deliveryNotes: 'Calm, authoritative tone. Make eye contact with camera. Slight pause between each point.',
      },
      {
        id: 'v3', style: 'storytelling', styleLabel: 'Story-Driven',
        hook: 'My boss laughed when I said I was quitting. Two years later, I hired him.',
        body: 'It was a Tuesday morning. I walked into my manager\'s office with my resignation letter shaking in my hands. He looked at it, looked at me, and actually laughed. "You\'ll be back in 6 months," he said. That moment lit a fire in me I\'ve never been able to put out...',
        cta: 'Drop a 🔥 if this resonated. Your story isn\'t over yet.',
        viralScore: 88,
        timestamps: ['0:00 - Hook', '0:06 - Scene setting', '0:20 - Conflict', '0:40 - Resolution', '0:55 - CTA'],
        deliveryNotes: 'Slow down on the "he laughed" moment. Build tension. Let the emotion show naturally.',
      },
    ],
  },
  {
    id: 'script-2',
    topic: '5 AI tools that replaced my entire team',
    platform: 'TikTok',
    niche: 'Tech',
    generatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    versions: [
      {
        id: 'v1', style: 'bold', styleLabel: 'Bold & Provocative',
        hook: 'I fired my $15k/month team and replaced them with 5 AI tools. Here\'s what happened.',
        body: 'Tool 1: Replaced my copywriter — saves $3k/month. Tool 2: Replaced my video editor — saves $4k/month. Tool 3: Replaced my customer support — saves $2k/month. Tool 4: Replaced my data analyst — saves $3k/month. Tool 5: Replaced my social media manager — saves $3k/month. Total saved: $15k/month.',
        cta: 'Comment "AI" and I\'ll DM you the full list with links.',
        viralScore: 94,
        timestamps: ['0:00 - Hook', '0:05 - Tool 1', '0:15 - Tool 2', '0:25 - Tool 3', '0:35 - Tools 4-5', '0:50 - CTA'],
        deliveryNotes: 'Fast-paced delivery. Show screen recordings of each tool. Use text overlays for the dollar amounts.',
      },
      {
        id: 'v2', style: 'balanced', styleLabel: 'Balanced & Informative',
        hook: 'The 5 AI tools every solopreneur needs in 2025.',
        body: 'Whether you\'re a freelancer or building a startup, these tools will 10x your output. I\'ve tested over 50 AI tools this year. These 5 made the cut because they\'re actually reliable, affordable, and save real time...',
        cta: 'Save this video — you\'ll thank yourself later.',
        viralScore: 82,
        timestamps: ['0:00 - Hook', '0:08 - Context', '0:20 - Tools breakdown', '0:50 - CTA'],
        deliveryNotes: 'Professional but approachable. Show tool interfaces briefly. Keep energy high.',
      },
      {
        id: 'v3', style: 'storytelling', styleLabel: 'Story-Driven',
        hook: 'Last year I was drowning in work. Then I discovered these 5 AI tools.',
        body: 'I was working 80-hour weeks, burning out, and still falling behind. My business was growing but I couldn\'t keep up. Then a friend showed me how he was running his entire operation solo with AI. I was skeptical. Three months later, I\'m working 30 hours a week and making more than ever...',
        cta: 'Which tool do you want me to demo first? Comment below.',
        viralScore: 86,
        timestamps: ['0:00 - Hook', '0:06 - Problem', '0:20 - Discovery', '0:35 - Transformation', '0:50 - CTA'],
        deliveryNotes: 'Start with visible exhaustion in your voice. Let the energy build as you describe the transformation.',
      },
    ],
  },
  {
    id: 'script-3',
    topic: 'The protein mistake costing you gains',
    platform: 'Instagram Reels',
    niche: 'Fitness',
    generatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    versions: [
      {
        id: 'v1', style: 'bold', styleLabel: 'Bold & Provocative',
        hook: 'You\'re eating enough protein and still not building muscle. Here\'s why.',
        body: 'The problem isn\'t how much protein you eat — it\'s WHEN you eat it. Most people front-load their protein at dinner. Your body can only absorb 30-40g per meal. Everything else? Wasted. Spread your protein across 4-5 meals. Hit your target every 3-4 hours. Watch your gains double in 8 weeks.',
        cta: 'Save this and share it with someone who\'s been stuck at the same weight.',
        viralScore: 89,
        timestamps: ['0:00 - Hook', '0:05 - The real problem', '0:20 - The fix', '0:40 - CTA'],
        deliveryNotes: 'Point at camera on the hook. Use a whiteboard or text overlay for the numbers.',
      },
      {
        id: 'v2', style: 'balanced', styleLabel: 'Balanced & Informative',
        hook: '3 protein timing mistakes that are killing your muscle gains.',
        body: 'Mistake 1: Eating all your protein in one meal. Mistake 2: Skipping protein before bed. Mistake 3: Not having protein within 30 minutes of training. Fix these three things and you\'ll see results within 4 weeks...',
        cta: 'Follow for daily fitness science that actually works.',
        viralScore: 81,
        timestamps: ['0:00 - Hook', '0:08 - Mistake 1', '0:22 - Mistake 2', '0:36 - Mistake 3', '0:52 - CTA'],
        deliveryNotes: 'Use numbered text overlays. Keep it educational but energetic.',
      },
      {
        id: 'v3', style: 'storytelling', styleLabel: 'Story-Driven',
        hook: 'I ate 200g of protein every day for a year and barely gained any muscle. Then I learned this.',
        body: 'I was doing everything right — or so I thought. Hitting my macros, training hard, sleeping 8 hours. But my gains had completely stalled. My trainer finally told me the truth: timing matters as much as quantity. I changed one thing — how I spread my protein throughout the day — and gained more muscle in 3 months than I had in the previous year.',
        cta: 'Drop a 💪 if you\'ve been making this mistake.',
        viralScore: 85,
        timestamps: ['0:00 - Hook', '0:08 - The struggle', '0:25 - The revelation', '0:45 - The result', '0:55 - CTA'],
        deliveryNotes: 'Show before/after physique photos if possible. Genuine frustration in the first half, excitement in the second.',
      },
    ],
  },
  {
    id: 'script-4',
    topic: 'How I saved $10k in 6 months on a $50k salary',
    platform: 'YouTube Long-form',
    niche: 'Finance',
    generatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    versions: [
      {
        id: 'v1', style: 'bold', styleLabel: 'Bold & Provocative',
        hook: 'I saved $10,000 in 6 months making $50k a year. Most people said it was impossible.',
        body: 'Here\'s the exact system: Month 1 — tracked every single expense. Found $800/month in subscriptions I forgot about. Month 2 — negotiated 3 bills. Saved $200/month. Month 3 — meal prepped every Sunday. Cut food costs by 60%. Month 4-6 — automated savings on payday. Treated it like a bill...',
        cta: 'Comment your salary and I\'ll tell you exactly how much you could save.',
        viralScore: 92,
        timestamps: ['0:00 - Hook', '1:00 - Month 1', '3:00 - Month 2', '5:00 - Month 3', '8:00 - Months 4-6', '12:00 - CTA'],
        deliveryNotes: 'Use a spreadsheet on screen. Show real numbers. Be vulnerable about past money mistakes.',
      },
      {
        id: 'v2', style: 'balanced', styleLabel: 'Balanced & Informative',
        hook: 'The 5-step savings system that helped me save $10k in 6 months.',
        body: 'Step 1: The 50/30/20 rule — but modified. Step 2: The subscription audit. Step 3: The negotiation playbook. Step 4: The meal prep system. Step 5: The automation trick. Each step builds on the last...',
        cta: 'Subscribe for weekly personal finance tips that actually work on a normal salary.',
        viralScore: 83,
        timestamps: ['0:00 - Hook', '2:00 - Step 1', '4:00 - Step 2', '6:00 - Step 3', '9:00 - Steps 4-5', '13:00 - CTA'],
        deliveryNotes: 'Use chapter markers. Keep energy consistent throughout. Show real app screenshots.',
      },
      {
        id: 'v3', style: 'storytelling', styleLabel: 'Story-Driven',
        hook: 'At 26, I had $200 in my bank account. At 27, I had $10,000. Here\'s what changed.',
        body: 'I remember the exact moment I decided to change. It was a Tuesday night, I was eating instant noodles, and I got a notification that my account was overdrawn. Again. I was making decent money — $50k a year — but I had nothing to show for it. That night I made a promise to myself...',
        cta: 'If you\'re in the same place I was, this video is for you. Share it with someone who needs it.',
        viralScore: 90,
        timestamps: ['0:00 - Hook', '1:30 - The rock bottom moment', '4:00 - The decision', '7:00 - The journey', '12:00 - The result', '14:00 - CTA'],
        deliveryNotes: 'Be genuinely vulnerable. The emotional authenticity is what makes this version work. Don\'t over-produce it.',
      },
    ],
  },
  {
    id: 'script-5',
    topic: 'Morning routine that changed my life',
    platform: 'LinkedIn Video',
    niche: 'Lifestyle',
    generatedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    versions: [
      {
        id: 'v1', style: 'bold', styleLabel: 'Bold & Provocative',
        hook: 'I wake up at 5am every day. Not because I\'m disciplined — because of this system.',
        body: 'Most morning routines fail because they rely on willpower. Mine doesn\'t. Here\'s the 3-part system: 1. Prepare the night before (10 minutes). 2. Remove all friction from the first 5 minutes. 3. Stack habits in the right order. I\'ve maintained this for 2 years straight...',
        cta: 'What\'s the one habit you\'ve been trying to build? Comment below.',
        viralScore: 87,
        timestamps: ['0:00 - Hook', '0:20 - The system', '1:00 - Part 1', '1:45 - Part 2', '2:30 - Part 3', '3:00 - CTA'],
        deliveryNotes: 'Film in the morning with natural light. Show your actual routine briefly. Professional but personal.',
      },
      {
        id: 'v2', style: 'balanced', styleLabel: 'Balanced & Informative',
        hook: 'The science-backed morning routine that top performers swear by.',
        body: 'Research shows the first 90 minutes of your day determine your productivity for the rest of it. Here\'s what the data says: hydration before caffeine, movement before screens, deep work before email. I\'ve applied this for 2 years and my output has tripled...',
        cta: 'Follow for evidence-based productivity content.',
        viralScore: 80,
        timestamps: ['0:00 - Hook', '0:30 - The research', '1:00 - Hydration', '1:30 - Movement', '2:00 - Deep work', '2:45 - CTA'],
        deliveryNotes: 'Reference specific studies. Use data visualizations. Keep it credible and professional.',
      },
      {
        id: 'v3', style: 'storytelling', styleLabel: 'Story-Driven',
        hook: 'I used to hit snooze 7 times every morning. Now I wake up before my alarm.',
        body: 'Two years ago, I was the person who set 5 alarms and still showed up late. I was exhausted, reactive, and always behind. A mentor challenged me to try one thing for 30 days: wake up at the same time every day, no exceptions. The first week was brutal. But by week 3, something shifted...',
        cta: 'Tag someone who needs to hear this. Your mornings set the tone for everything.',
        viralScore: 84,
        timestamps: ['0:00 - Hook', '0:20 - The old me', '0:50 - The challenge', '1:30 - The shift', '2:30 - The result', '3:00 - CTA'],
        deliveryNotes: 'Authentic and relatable. Don\'t make it sound too perfect. The struggle makes it believable.',
      },
    ],
  },
];

const PLATFORMS = ['All Platforms', 'YouTube Shorts', 'TikTok', 'Instagram Reels', 'YouTube Long-form', 'LinkedIn Video'];
const NICHES = ['All Niches', 'Finance', 'Fitness', 'Tech', 'Comedy', 'Travel', 'Education', 'Food', 'Lifestyle', 'Business', 'Health', 'Gaming', 'Beauty'];

const DATE_RANGES = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
];

function getScoreColor(score: number): string {
  if (score >= 85) return 'text-green-500';
  if (score >= 75) return 'text-yellow-500';
  return 'text-orange-500';
}

function getScoreBg(score: number): string {
  if (score >= 85) return 'bg-green-500/10 border-green-500/20';
  if (score >= 75) return 'bg-yellow-500/10 border-yellow-500/20';
  return 'bg-orange-500/10 border-orange-500/20';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getPlatformColor(platform: string): string {
  const map: Record<string, string> = {
    'YouTube Shorts': 'text-red-500 bg-red-500/10 border-red-500/20',
    'TikTok': 'text-pink-500 bg-pink-500/10 border-pink-500/20',
    'Instagram Reels': 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    'YouTube Long-form': 'text-red-600 bg-red-600/10 border-red-600/20',
    'LinkedIn Video': 'text-blue-600 bg-blue-600/10 border-blue-600/20',
  };
  return map[platform] || 'text-muted-foreground bg-muted border-border';
}

// ─── Script Detail Modal ──────────────────────────────────────────────────────

function ScriptDetailModal({ script, onClose }: { script: SavedScript; onClose: () => void }) {
  const [activeVersion, setActiveVersion] = useState(script.versions[0]?.id || 'v1');
  const [copied, setCopied] = useState(false);

  const version = script.versions.find((v) => v.id === activeVersion) || script.versions[0];

  const handleCopy = () => {
    if (!version) return;
    const text = `TOPIC: ${script.topic}\nPLATFORM: ${script.platform}\n\nHOOK:\n${version.hook}\n\nSCRIPT:\n${version.body}\n\nCALL TO ACTION:\n${version.cta}\n\nDELIVERY NOTES:\n${version.deliveryNotes}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="card-surface border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-start justify-between gap-3 z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-xs font-mono-custom px-2.5 py-1 rounded-full border ${getPlatformColor(script.platform)}`}>
                {script.platform}
              </span>
              {script.niche && (
                <span className="text-xs font-mono-custom px-2.5 py-1 rounded-full border border-border bg-muted text-muted-foreground">
                  {script.niche}
                </span>
              )}
            </div>
            <h2 className="font-display text-base font-bold text-foreground leading-snug">&ldquo;{script.topic}&rdquo;</h2>
            <p className="text-xs text-muted-foreground font-sans mt-0.5">{formatDate(script.generatedAt)}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors flex-shrink-0">
            <Icon name="XMarkIcon" size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Version tabs */}
        <div className="px-5 pt-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {script.versions.map((v) => (
              <button
                key={v.id}
                onClick={() => setActiveVersion(v.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-sans font-medium border transition-all ${
                  activeVersion === v.id
                    ? 'bg-primary/10 border-primary text-foreground'
                    : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{v.styleLabel}</span>
                <span className={`font-mono-custom font-bold ${getScoreColor(v.viralScore)}`}>{v.viralScore}%</span>
              </button>
            ))}
          </div>
        </div>

        {/* Version content */}
        {version && (
          <div className="p-5 space-y-4">
            {/* Virality score */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border w-fit ${getScoreBg(version.viralScore)}`}>
              <Icon name="FireIcon" size={14} variant="solid" className={getScoreColor(version.viralScore)} />
              <span className={`text-sm font-mono-custom font-bold ${getScoreColor(version.viralScore)}`}>
                Virality Score: {version.viralScore}%
              </span>
            </div>

            {/* Hook */}
            <div className="p-4 bg-primary/5 border border-primary/15 rounded-xl">
              <p className="text-xs font-mono-custom uppercase tracking-wide text-primary font-bold mb-2">⚡ Hook</p>
              <p className="text-sm font-sans text-foreground leading-relaxed italic">&ldquo;{version.hook}&rdquo;</p>
            </div>

            {/* Body */}
            <div>
              <p className="text-xs font-mono-custom uppercase tracking-wide text-muted-foreground font-bold mb-2">Script Body</p>
              <p className="text-sm font-sans text-foreground leading-relaxed whitespace-pre-line">{version.body}</p>
            </div>

            {/* CTA */}
            <div className="p-4 bg-accent/5 border border-accent/15 rounded-xl">
              <p className="text-xs font-mono-custom uppercase tracking-wide text-accent font-bold mb-2">Call to Action</p>
              <p className="text-sm font-sans text-foreground">{version.cta}</p>
            </div>

            {/* Timestamps */}
            {version.timestamps?.length > 0 && (
              <div>
                <p className="text-xs font-mono-custom uppercase tracking-wide text-muted-foreground font-bold mb-2">Timestamps</p>
                <div className="space-y-1.5">
                  {version.timestamps.map((ts, i) => (
                    <div key={`ts-${i}`} className="flex items-center gap-2 text-xs font-sans text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50 flex-shrink-0" />
                      {ts}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery notes */}
            {version.deliveryNotes && (
              <div className="p-4 bg-muted rounded-xl">
                <p className="text-xs font-mono-custom uppercase tracking-wide text-muted-foreground font-bold mb-2">🎬 Delivery Notes</p>
                <p className="text-sm font-sans text-muted-foreground leading-relaxed">{version.deliveryNotes}</p>
              </div>
            )}

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-sm font-sans font-semibold transition-colors"
            >
              <Icon name={copied ? 'CheckIcon' : 'ClipboardDocumentIcon'} size={16} />
              {copied ? 'Copied!' : 'Copy Full Script'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Script Row Card ──────────────────────────────────────────────────────────

function ScriptRowCard({
  script,
  isSelected,
  onToggleSelect,
  onView,
}: {
  script: SavedScript;
  isSelected: boolean;
  onToggleSelect: () => void;
  onView: () => void;
}) {
  const bestScore = Math.max(...script.versions.map((v) => v.viralScore));

  return (
    <div
      className={`card-surface border rounded-2xl p-4 flex items-center gap-4 transition-all duration-150 ${
        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={onToggleSelect}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          isSelected ? 'bg-primary border-primary' : 'border-border hover:border-primary/50'
        }`}
      >
        {isSelected && <Icon name="CheckIcon" size={12} className="text-white" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onView}>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`text-xs font-mono-custom px-2 py-0.5 rounded-full border ${getPlatformColor(script.platform)}`}>
            {script.platform}
          </span>
          {script.niche && (
            <span className="text-xs font-mono-custom px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground">
              {script.niche}
            </span>
          )}
        </div>
        <p className="text-sm font-sans font-semibold text-foreground truncate">{script.topic}</p>
        <p className="text-xs text-muted-foreground font-sans mt-0.5">
          {script.versions.length} versions · {formatDate(script.generatedAt)}
        </p>
      </div>

      {/* Score */}
      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-mono-custom font-bold tabular-nums flex-shrink-0 ${getScoreBg(bestScore)} ${getScoreColor(bestScore)}`}>
        <Icon name="FireIcon" size={12} variant="solid" />
        {bestScore}%
      </div>

      {/* View button */}
      <button
        onClick={onView}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted border border-border text-xs font-sans font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all flex-shrink-0"
      >
        <Icon name="EyeIcon" size={14} />
        View
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SavedScriptsContent() {
  const [scripts, setScripts] = useState<SavedScript[]>(MOCK_SCRIPTS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [platformFilter, setPlatformFilter] = useState('All Platforms');
  const [nicheFilter, setNicheFilter] = useState('All Niches');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [viewingScript, setViewingScript] = useState<SavedScript | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const filteredScripts = useMemo(() => {
    let result = [...scripts];

    // Platform filter
    if (platformFilter !== 'All Platforms') {
      result = result.filter((s) => s.platform === platformFilter);
    }

    // Niche filter
    if (nicheFilter !== 'All Niches') {
      result = result.filter((s) => s.niche === nicheFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = Date.now();
      const ranges: Record<string, number> = {
        today: 1 * 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000,
      };
      const cutoff = now - (ranges[dateFilter] || 0);
      result = result.filter((s) => new Date(s.generatedAt).getTime() >= cutoff);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.topic.toLowerCase().includes(q) ||
          s.platform.toLowerCase().includes(q) ||
          s.niche.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'date') {
      result.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
    } else {
      result.sort((a, b) => {
        const aScore = Math.max(...a.versions.map((v) => v.viralScore));
        const bScore = Math.max(...b.versions.map((v) => v.viralScore));
        return bScore - aScore;
      });
    }

    return result;
  }, [scripts, platformFilter, nicheFilter, dateFilter, searchQuery, sortBy]);

  const allSelected = filteredScripts.length > 0 && filteredScripts.every((s) => selectedIds.has(s.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredScripts.map((s) => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkExport = () => {
    const toExport = scripts.filter((s) => selectedIds.has(s.id));
    if (toExport.length === 0) return;

    const lines: string[] = [];
    toExport.forEach((script, idx) => {
      lines.push(`${'='.repeat(60)}`);
      lines.push(`SCRIPT ${idx + 1}: ${script.topic}`);
      lines.push(`Platform: ${script.platform} | Niche: ${script.niche || 'General'} | Generated: ${formatDate(script.generatedAt)}`);
      lines.push('');
      script.versions.forEach((v) => {
        lines.push(`--- ${v.styleLabel} (Virality Score: ${v.viralScore}%) ---`);
        lines.push(`HOOK: ${v.hook}`);
        lines.push('');
        lines.push(`SCRIPT:\n${v.body}`);
        lines.push('');
        lines.push(`CTA: ${v.cta}`);
        lines.push('');
        if (v.timestamps?.length) {
          lines.push(`TIMESTAMPS:\n${v.timestamps.join('\n')}`);
          lines.push('');
        }
        if (v.deliveryNotes) {
          lines.push(`DELIVERY NOTES: ${v.deliveryNotes}`);
          lines.push('');
        }
      });
      lines.push('');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `viral-scripts-export-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2500);
  };

  const handleDeleteSelected = () => {
    setScripts((prev) => prev.filter((s) => !selectedIds.has(s.id)));
    setSelectedIds(new Set());
  };

  const avgScore =
    scripts.length > 0
      ? Math.round(scripts.reduce((acc, s) => acc + Math.max(...s.versions.map((v) => v.viralScore)), 0) / scripts.length)
      : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border px-5 sm:px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flame-gradient flex items-center justify-center flex-shrink-0">
            <Icon name="ArchiveBoxIcon" size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-extrabold text-foreground">Saved Scripts</h1>
            <p className="text-sm text-muted-foreground font-sans mt-0.5">Manage and export your viral script library</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono-custom text-sm font-bold text-muted-foreground bg-muted px-3 py-2 rounded-xl border-2 border-border">
            {scripts.length} scripts
          </span>
        </div>
      </div>

      <div className="px-5 sm:px-6 py-6 max-w-screen-xl mx-auto space-y-5">

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Scripts', value: scripts.length.toString(), icon: 'DocumentTextIcon', color: 'text-primary' },
            { label: 'Avg Virality Score', value: `${avgScore}%`, icon: 'FireIcon', color: 'text-orange-500' },
            { label: 'Platforms Used', value: [...new Set(scripts.map((s) => s.platform))].length.toString(), icon: 'DevicePhoneMobileIcon', color: 'text-blue-500' },
            { label: 'Script Versions', value: scripts.reduce((a, s) => a + s.versions.length, 0).toString(), icon: 'DocumentDuplicateIcon', color: 'text-purple-500' },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border-2 border-border rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <Icon name={stat.icon as any} size={20} className={stat.color} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-mono-custom font-extrabold text-foreground tabular-nums">{stat.value}</p>
                <p className="text-sm text-muted-foreground font-sans font-medium leading-tight">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters row */}
        <div className="bg-card border-2 border-border rounded-2xl p-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Icon name="MagnifyingGlassIcon" size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scripts..."
                className="w-full bg-muted border-2 border-border rounded-xl pl-10 pr-3 py-2.5 text-sm font-bold font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>

            {/* Platform filter */}
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-muted border-2 border-border rounded-xl px-3 py-2.5 text-sm font-bold font-sans text-foreground focus:outline-none focus:border-primary/50 transition-all"
            >
              {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>

            {/* Niche filter */}
            <select
              value={nicheFilter}
              onChange={(e) => setNicheFilter(e.target.value)}
              className="bg-muted border-2 border-border rounded-xl px-3 py-2.5 text-sm font-bold font-sans text-foreground focus:outline-none focus:border-primary/50 transition-all"
            >
              {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>

            {/* Date filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-muted border-2 border-border rounded-xl px-3 py-2.5 text-sm font-bold font-sans text-foreground focus:outline-none focus:border-primary/50 transition-all"
            >
              {DATE_RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>

            {/* Sort */}
            <div className="flex items-center gap-1 bg-muted border-2 border-border rounded-xl p-1">
              {[{ label: 'Date', value: 'date' as const }, { label: 'Score', value: 'score' as const }].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${
                    sortBy === opt.value ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bulk actions bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-primary/10 border border-primary/20 rounded-2xl flex-wrap">
            <p className="text-sm font-sans font-medium text-foreground">
              <span className="font-bold text-primary">{selectedIds.size}</span> script{selectedIds.size > 1 ? 's' : ''} selected
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkExport}
                className="flex items-center gap-2 px-4 py-2 rounded-xl flame-gradient text-white text-sm font-sans font-semibold shadow-flame hover:opacity-90 transition-all"
              >
                <Icon name={exportSuccess ? 'CheckIcon' : 'ArrowDownTrayIcon'} size={16} />
                {exportSuccess ? 'Exported!' : 'Export Selected'}
              </button>
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-sans font-medium hover:bg-red-500/20 transition-all"
              >
                <Icon name="TrashIcon" size={16} />
                Delete
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-2 rounded-xl bg-muted border border-border text-muted-foreground text-sm font-sans hover:text-foreground transition-all"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Scripts list */}
        <div className="card-surface border border-border rounded-2xl overflow-hidden">
          {/* List header */}
          <div className="px-4 py-3 border-b border-border flex items-center gap-4 bg-muted/50">
            <button
              onClick={toggleSelectAll}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                allSelected ? 'bg-primary border-primary' : 'border-border hover:border-primary/50'
              }`}
            >
              {allSelected && <Icon name="CheckIcon" size={12} className="text-white" />}
            </button>
            <p className="text-xs font-mono-custom uppercase tracking-wide text-muted-foreground font-bold">
              {filteredScripts.length} result{filteredScripts.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Script rows */}
          {filteredScripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Icon name="DocumentTextIcon" size={28} className="text-muted-foreground" />
              </div>
              <h3 className="font-display text-base font-bold text-foreground mb-1">No scripts found</h3>
              <p className="text-sm font-sans text-muted-foreground max-w-xs">
                Try adjusting your filters or generate new scripts from the Viral Script Writer.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredScripts.map((script) => (
                <div key={script.id} className="p-3">
                  <ScriptRowCard
                    script={script}
                    isSelected={selectedIds.has(script.id)}
                    onToggleSelect={() => toggleSelect(script.id)}
                    onView={() => setViewingScript(script)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {viewingScript && (
        <ScriptDetailModal script={viewingScript} onClose={() => setViewingScript(null)} />
      )}
    </div>
  );
}
