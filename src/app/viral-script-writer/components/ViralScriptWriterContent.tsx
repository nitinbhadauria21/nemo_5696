'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@/lib/hooks/useChat';
import toast from 'react-hot-toast';
import Icon from '@/components/ui/AppIcon';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Platform {
  id: string;
  label: string;
  icon: string;
  duration: string;
  color: string;
}

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
  rawMarkdown?: string;
}

interface GeneratedScript {
  topic: string;
  platform: string;
  niche: string;
  language: string;
  audienceType: string;
  versions: ScriptVersion[];
  generatedAt: string;
}

type ParsedBlock =
  | { type: 'scene-header'; sceneLabel: string; sceneTitle: string }
  | { type: 'visual-cue'; text: string }
  | { type: 'audio-script'; text: string }
  | { type: 'cta'; text: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORMS: Platform[] = [
  { id: 'youtube-shorts', label: 'YouTube Shorts', icon: 'PlayIcon', duration: '60s', color: 'text-red-500 bg-red-500/10 border-red-500/20' },
  { id: 'tiktok', label: 'TikTok', icon: 'MusicalNoteIcon', duration: '30–60s', color: 'text-pink-500 bg-pink-500/10 border-pink-500/20' },
  { id: 'instagram-reels', label: 'Instagram Reels', icon: 'CameraIcon', duration: '30–90s', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  { id: 'youtube-long', label: 'YouTube Long-form', icon: 'FilmIcon', duration: '5–15 min', color: 'text-red-600 bg-red-600/10 border-red-600/20' },
  { id: 'linkedin', label: 'LinkedIn Video', icon: 'BriefcaseIcon', duration: '1–3 min', color: 'text-blue-600 bg-blue-600/10 border-blue-600/20' },
];

const NICHES = [
  'Finance', 'Fitness', 'Tech', 'Comedy', 'Travel', 'Education',
  'Food', 'Lifestyle', 'Business', 'Health', 'Gaming', 'Beauty',
];

const LANGUAGES = [
  'English', 'Hindi', 'Hinglish', 'Spanish', 'French', 'Portuguese', 'German',
  'Arabic', 'Japanese', 'Korean', 'Italian',
];

const AUDIENCE_TYPES = ['Relatable', 'Informative', 'Science', 'Motivational', 'Other'];

const LOADING_STEPS = [
  'Applying pattern interrupt hooks…',
  'Parsing visual-auditory sync cues…',
  'Structuring HEARS · PAW · C4 frameworks…',
  'Engineering emotional journey arc…',
  'Calibrating virality scores & CTAs…',
  'Finalising scene-by-scene breakdown…',
];

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are NemoScript — an advanced viral video script engineering engine built on a decade of behavioral science, digital psychology, cognitive load theory, and conversion copywriting. Your sole purpose is to craft micro-narratives optimized for social media recommendation algorithms that maximize video completion rates, saves, and repeat views.

═══════════════════════════════════════════════════
CORE PRINCIPLE: THE FIRST 3 SECONDS RULE
═══════════════════════════════════════════════════
Up to 80% of a video's ultimate reach is determined in the first 3 seconds. Every script MUST open with a PATTERN INTERRUPT — a sudden deviation from expected social media norms that forces the brain out of passive scroll mode.

PATTERN INTERRUPT RULES:
- Start MID-SENTENCE or MID-ACTION with a high-resonance declarative sentence
- ✅ CORRECT: "This is why you're still broke..." / "Nobody tells you this about..." - ❌ WRONG:"Hey guys, today I'm going to show you..."
- Use the CURIOSITY GAP (Loewenstein 1994): highlight a mystery, hidden truth, or unconventional claim

═══════════════════════════════════════════════════
THREE STRUCTURAL FRAMEWORKS — USE ONE PER VERSION
═══════════════════════════════════════════════════

VERSION 1 — HEARS FRAMEWORK (Relatable & Informative):
Hook → Empathy → Authority → Reason → Solution

VERSION 2 — PAW FRAMEWORK (Motivational & Pain-Point):
Problem → Agitate → Win/Workaround

VERSION 3 — C4 FRAMEWORK (Conversion & Fast-Paced):
Captivate → Connect → Convince → Convert

═══════════════════════════════════════════════════
COGNITIVE LOAD THEORY — DUAL-CODING RULES
═══════════════════════════════════════════════════
1. VISUAL-AUDITORY SYNCHRONICITY: Audio and visual channels must reinforce each other.
2. THE 3-SECOND CUT RULE: Force visual scene changes every 3–4 seconds.

═══════════════════════════════════════════════════
EMOTIONAL JOURNEY STRUCTURE
═══════════════════════════════════════════════════
Every script MUST follow: FRICTION LOOP → AGITATION SPIKE → RELIEF BEAT

═══════════════════════════════════════════════════
OUTPUT FORMAT — RESPOND WITH VALID JSON ONLY
═══════════════════════════════════════════════════
{
  "versions": [
    {
      "id": "v1",
      "style": "hears",
      "styleLabel": "HEARS — Relatable & Informative",
      "hook": "Pattern interrupt opening line",
      "viralScore": 88,
      "timestamps": ["0:00 - Pattern interrupt hook", "0:03 - Empathy validation"],
      "deliveryNotes": "Specific visual-auditory sync instructions",
      "rawMarkdown": "# Scene 1: The Scroll-Stopper Hook\\n[Visual Cue]: Fast zoom-in on host looking frustrated, big text overlay: STOP WAITING.\\n[Audio Script]: Most creators think they need 10 hours to make one video. That's a flat out lie.\\n\\n# Scene 2: The Agitation Trap\\n[Visual Cue]: Close-up of camera lens. Text transition: NemoScript does it in 5 seconds.\\n[Audio Script]: Look at this. You paste one word, choose your scene count, and you get a dual-direction map.\\n\\n# Scene 3: The System Reveal\\n[Visual Cue]: Over-the-shoulder view of host smiling, typing on laptop.\\n[Audio Script]: It divides camera b-roll cues from actual voiceovers so you never get stuck during editing.\\n\\n# Scene 4: The Strategic Benefit\\n[Visual Cue]: Quick cut showing a high-contrast screen. Accent lighting in background.\\n[Audio Script]: No more staring at a blank Google Doc wondering what to shoot.\\n\\n# Scene 5: High-Impact Call to Action\\n[Visual Cue]: Split screen of the creator pointing down to the comments.\\nCTA: Comment NEMO and I will send you the secret beta access link right now!"
    },
    {
      "id": "v2",
      "style": "paw",
      "styleLabel": "PAW — Motivational & Pain-Point",
      "hook": "...",
      "viralScore": 84,
      "timestamps": [...],
      "deliveryNotes": "...",
      "rawMarkdown": "# Scene 1: ...\\n[Visual Cue]: ...\\n[Audio Script]: ...\\n\\n# Scene 2: ...\\n[Visual Cue]: ...\\n[Audio Script]: ...\\n\\nCTA: ..."
    },
    {
      "id": "v3",
      "style": "c4",
      "styleLabel": "C4 — Captivate, Connect, Convince, Convert",
      "hook": "...",
      "viralScore": 81,
      "timestamps": [...],
      "deliveryNotes": "...",
      "rawMarkdown": "# Scene 1: ...\\n[Visual Cue]: ...\\n[Audio Script]: ...\\n\\nCTA: ..."
    }
  ]
}

CRITICAL RULES FOR rawMarkdown:
- Each scene starts with "# Scene N: Scene Title"
- Visual directions use EXACTLY: [Visual Cue]: <instruction>
- Spoken dialog uses EXACTLY: [Audio Script]: <spoken words>
- CTA uses EXACTLY: CTA: <call to action text>
- Alternate [Visual Cue] and [Audio Script] for every scene
- End with a CTA: line (not inside a scene header)
- Use \\n for newlines in the JSON string
- Include 4-6 scenes per script`;

// ─── Dynamic Script Parser ────────────────────────────────────────────────────

function parseMarkdownToBlocks(markdown: string): ParsedBlock[] {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  const blocks: ParsedBlock[] = [];
  let sceneCounter = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Scene Header: starts with # or contains Scene/Part
    if (/^#+\s/.test(line) || /^(Scene\s*\d+|Part\s*\d+)/i.test(line)) {
      sceneCounter++;
      const titleText = line.replace(/^#+\s*/, '').trim();
      blocks.push({
        type: 'scene-header',
        sceneLabel: `SCENE SEGMENT ${sceneCounter}`,
        sceneTitle: titleText,
      });
      continue;
    }

    // Visual Cue
    const visualMatch = line.match(/^\[Visual Cue\]:\s*(.+)/i) || line.match(/^Visual Cue:\s*(.+)/i);
    if (visualMatch) {
      blocks.push({ type: 'visual-cue', text: visualMatch[1].trim() });
      continue;
    }

    // Audio Script
    const audioMatch = line.match(/^\[Audio Script\]:\s*(.+)/i) || line.match(/^Audio Script:\s*(.+)/i);
    if (audioMatch) {
      blocks.push({ type: 'audio-script', text: audioMatch[1].trim() });
      continue;
    }

    // CTA
    const ctaMatch = line.match(/^CTA:\s*(.+)/i) || line.match(/^\[CTA\]:\s*(.+)/i);
    if (ctaMatch) {
      blocks.push({ type: 'cta', text: ctaMatch[1].trim() });
      continue;
    }
  }

  return blocks;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseScriptResponse(raw: string): ScriptVersion[] {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.versions || [];
  } catch {
    return [];
  }
}

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

// ─── Scene Header Card ────────────────────────────────────────────────────────

function SceneHeaderCard({ block }: { block: Extract<ParsedBlock, { type: 'scene-header' }> }) {
  return (
    <div className="flex items-center gap-3 pt-4 pb-1">
      <div className="flex-shrink-0 px-2.5 py-1 rounded-full bg-[#FF3D00]/10 border border-[#FF3D00]/20">
        <span className="text-[10px] font-mono tracking-widest uppercase text-[#FF3D00] font-bold">{block.sceneLabel}</span>
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-[#FF3D00]/20 to-transparent" />
      <span className="text-sm font-bold text-[#F7EFE7] font-display truncate max-w-[200px]">{block.sceneTitle}</span>
    </div>
  );
}

// ─── Visual Cue Card ─────────────────────────────────────────────────────────

function VisualCueCard({ text }: { text: string }) {
  return (
    <div className="flex gap-3 items-start p-3.5 rounded-xl bg-[#1A1210]/80 border border-[#6B534E]/30 hover:border-[#FF3D00]/30 transition-colors">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#FF3D00]/10 border border-[#FF3D00]/20 flex items-center justify-center">
        <Icon name="VideoCameraIcon" size={15} className="text-[#FF3D00]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF3D00] font-bold mb-1">Visual Direction</p>
        <p className="text-sm text-stone-300 leading-relaxed font-sans">{text}</p>
      </div>
    </div>
  );
}

// ─── Audio Script Card ────────────────────────────────────────────────────────

function AudioScriptCard({ text }: { text: string }) {
  return (
    <div className="flex gap-3 items-start p-3.5 rounded-xl bg-[#1A1210]/80 border border-[#6B534E]/20 hover:border-white/20 transition-colors">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center">
        <Icon name="MicrophoneIcon" size={15} className="text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#F7EFE7]/60 font-bold mb-1">Audio / Voiceover</p>
        <p className="text-base italic font-medium text-[#F7EFE7] leading-relaxed font-sans">&ldquo;{text}&rdquo;</p>
      </div>
    </div>
  );
}

// ─── CTA Card ────────────────────────────────────────────────────────────────

function CTACard({ text }: { text: string }) {
  return (
    <div className="p-6 rounded-3xl text-center shadow-lg flame-gradient mt-2">
      <p className="text-[10px] font-mono uppercase tracking-widest text-white/70 font-bold mb-2">🔥 Final Call to Action</p>
      <p className="text-xl font-bold text-white font-display leading-snug">{text}</p>
    </div>
  );
}

// ─── Parsed Script Viewer ─────────────────────────────────────────────────────

function ParsedScriptViewer({ version }: { version: ScriptVersion }) {
  const blocks = parseMarkdownToBlocks(version.rawMarkdown || '');

  if (blocks.length === 0) {
    // Fallback: show raw body text
    return (
      <div className="space-y-3 pt-2">
        <div className="p-3 bg-[#1A1210]/80 border border-[#6B534E]/20 rounded-xl">
          <p className="text-sm text-[#F7EFE7] leading-relaxed whitespace-pre-line font-sans">{version.body}</p>
        </div>
        {version.cta && <CTACard text={version.cta} />}
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-2">
      {blocks.map((block, i) => {
        if (block.type === 'scene-header') return <SceneHeaderCard key={i} block={block} />;
        if (block.type === 'visual-cue') return <VisualCueCard key={i} text={block.text} />;
        if (block.type === 'audio-script') return <AudioScriptCard key={i} text={block.text} />;
        if (block.type === 'cta') return <CTACard key={i} text={block.text} />;
        return null;
      })}
    </div>
  );
}

// ─── Script Card (Full Output) ────────────────────────────────────────────────

function ScriptCard({ version, isSelected, onSelect }: { version: ScriptVersion; isSelected: boolean; onSelect: () => void }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fullScript = version.rawMarkdown
    ? version.rawMarkdown
    : `HOOK:\n${version.hook}\n\nSCRIPT:\n${version.body}\n\nCALL TO ACTION:\n${version.cta}`;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(fullScript).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 border ${
        isSelected
          ? 'border-[#FF3D00] ring-2 ring-[#FF3D00]/20 bg-[#1A1210]'
          : 'border-[#6B534E]/30 bg-[#1A1210]/60 hover:border-[#FF3D00]/40'
      }`}
    >
      {/* ── Header & Metadata Zone ── */}
      <div className="p-4 flex items-center justify-between gap-3 border-b border-[#6B534E]/20">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSelected ? 'bg-[#FF3D00]' : 'bg-[#6B534E]'}`} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#F7EFE7] truncate font-sans">{version.styleLabel}</p>
            <p className="text-xs text-[#6B534E] font-mono">Version {version.id.replace('v', '')}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-mono font-bold tabular-nums ${getScoreBg(version.viralScore)} ${getScoreColor(version.viralScore)}`}>
          <Icon name="FireIcon" size={14} variant="solid" />
          {version.viralScore}%
        </div>
      </div>

      {/* Hook preview */}
      <div className="px-4 pt-3 pb-2">
        <div className="p-3 bg-[#FF3D00]/5 border border-[#FF3D00]/15 rounded-xl">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF3D00] font-bold mb-1">⚡ Pattern Interrupt Hook</p>
          <p className="text-sm font-sans text-[#F7EFE7] leading-relaxed italic">&ldquo;{version.hook}&rdquo;</p>
        </div>
      </div>

      {/* Expand toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
        className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-sans text-[#6B534E] hover:text-[#F7EFE7] border-t border-[#6B534E]/20 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Icon name="RectangleStackIcon" size={13} />
          {expanded ? 'Hide scene breakdown' : 'View scene-by-scene breakdown'}
        </span>
        <Icon name={expanded ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={14} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[#6B534E]/20">
          {/* ── Audio-Visual Alternation Zone ── */}
          <ParsedScriptViewer version={version} />

          {/* Timestamps */}
          {version.timestamps?.length > 0 && (
            <div className="pt-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#6B534E] font-bold mb-2">Timestamps</p>
              <div className="space-y-1">
                {version.timestamps.map((ts, i) => (
                  <div key={`ts-${i}`} className="flex items-center gap-2 text-xs font-sans text-[#6B534E]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF3D00]/50 flex-shrink-0" />
                    {ts}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivery notes */}
          {version.deliveryNotes && (
            <div className="p-3 bg-[#FFB000]/5 border border-[#FFB000]/15 rounded-xl">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#FFB000] font-bold mb-1">🎬 Delivery Notes</p>
              <p className="text-xs font-sans text-[#F7EFE7]/70 leading-relaxed">{version.deliveryNotes}</p>
            </div>
          )}

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#FF3D00]/10 hover:bg-[#FF3D00]/20 text-[#FF3D00] text-sm font-sans font-semibold transition-colors border border-[#FF3D00]/20"
          >
            <Icon name={copied ? 'CheckIcon' : 'ClipboardDocumentIcon'} size={16} />
            {copied ? 'Copied!' : 'Copy Full Script'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Retention Strategy Panel ─────────────────────────────────────────────────

function RetentionStrategyPanel({ audienceType, language }: { audienceType: string; language: string }) {
  const hookStrategy: Record<string, string> = {
    Relatable: 'addresses a direct pain point for Relatable audiences. Start with a high-impact pattern interrupt that mirrors the viewer\'s daily frustration.',
    Informative: 'delivers a knowledge gap for Informative audiences. Open with a surprising fact or counterintuitive claim that challenges existing beliefs.',
    Science: 'leverages cognitive dissonance for Science audiences. Lead with a data-backed contradiction that forces the brain to seek resolution.',
    Motivational: 'triggers emotional urgency for Motivational audiences. Begin with a high-stakes consequence that creates immediate psychological tension.',
    Other: 'uses a curiosity gap tailored to your niche. Open mid-sentence with an unresolved statement that demands the viewer keep watching.',
  };

  const langPacing: Record<string, string> = {
    English: 'High-velocity pacing — punchy declarative sentences, no filler words, momentum-driven delivery.',
    Hindi: 'Emotion-first delivery — dramatic pauses for retention, warm vernacular, culturally resonant metaphors.',
    Hinglish: 'Casual friend-to-friend tone — blend Hindi expressions with English nouns, frictionless and colloquial.',
  };

  const strategy = hookStrategy[audienceType] || hookStrategy['Relatable'];
  const pacing = langPacing[language] || 'Adapt pacing to regional content consumption patterns and cultural nuance.';

  return (
    <div className="rounded-2xl border border-[#6B534E]/30 bg-[#1A1210]/60 overflow-hidden">
      <div className="px-4 py-3 border-b border-[#6B534E]/20 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[#FFB000]/10 border border-[#FFB000]/20 flex items-center justify-center flex-shrink-0">
          <Icon name="ChartBarIcon" size={14} className="text-[#FFB000]" />
        </div>
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-[#FFB000] font-bold">Retention Strategy Panel</p>
          <p className="text-[10px] text-[#6B534E] font-sans">Hook delivery psychology</p>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="p-3 bg-[#FFB000]/5 border border-[#FFB000]/10 rounded-xl">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#FFB000] font-bold mb-1.5">Hook Strategy</p>
          <p className="text-sm font-sans text-[#F7EFE7]/80 leading-relaxed">
            The hook {strategy}
          </p>
        </div>
        <div className="p-3 bg-[#6B534E]/10 border border-[#6B534E]/20 rounded-xl">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#6B534E] font-bold mb-1.5">Language Pacing — {language}</p>
          <p className="text-sm font-sans text-[#F7EFE7]/70 leading-relaxed">{pacing}</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-sans text-[#6B534E]">
          <Icon name="InformationCircleIcon" size={13} />
          <span>Friction Loop → Agitation Spike → Relief Beat emotional arc applied</span>
        </div>
      </div>
    </div>
  );
}

// ─── Viral Trigger Panel ──────────────────────────────────────────────────────

function ViralTriggerPanel({ platform, viralScore }: { platform: string; viralScore: number }) {
  const triggers = [
    { label: 'Curiosity Gap', desc: 'Opening hook creates an unresolved information gap that compels viewers to watch to completion.', icon: 'MagnifyingGlassIcon', color: 'text-purple-400' },
    { label: 'Comment-to-DM CTA', desc: 'Single-action CTA drives comment velocity — the highest-weighted algorithmic signal on short-form platforms.', icon: 'ChatBubbleLeftRightIcon', color: 'text-blue-400' },
    { label: 'Dual-Coding Sync', desc: 'Visual and audio cues are synchronized every 3–4 seconds to reduce cognitive load and increase retention.', icon: 'FilmIcon', color: 'text-green-400' },
  ];

  const recordingTips: Record<string, string> = {
    'YouTube Shorts': 'Record in 9:16 vertical. Use a lavalier mic for crisp audio. Shoot in natural light or a ring light setup.',
    'TikTok': 'Record in-app or import 9:16 footage. Use trending audio hooks in the first 0.5s. Keep cuts under 3 seconds.',
    'Instagram Reels': 'Use 9:16 at 1080×1920. Add captions — 85% of Reels are watched without sound. Hook text overlay in first frame.',
    'YouTube Long-form': 'Record in 16:9 at 1080p minimum. Use a directional mic. B-roll every 4–6 seconds to maintain engagement.',
    'LinkedIn Video': 'Square (1:1) or 16:9. Professional background. Subtitles mandatory — LinkedIn auto-mutes. Keep under 3 minutes.',
  };

  const tip = recordingTips[platform] || 'Use a lavalier mic for best audio quality. Record in good lighting. Keep cuts tight.';

  return (
    <div className="rounded-2xl border border-[#6B534E]/30 bg-[#1A1210]/60 overflow-hidden">
      <div className="px-4 py-3 border-b border-[#6B534E]/20 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[#FF3D00]/10 border border-[#FF3D00]/20 flex items-center justify-center flex-shrink-0">
          <Icon name="RocketLaunchIcon" size={14} className="text-[#FF3D00]" />
        </div>
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-[#FF3D00] font-bold">Viral Trigger Panel</p>
          <p className="text-[10px] text-[#6B534E] font-sans">Engagement techniques applied</p>
        </div>
        <div className={`ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-mono font-bold ${getScoreBg(viralScore)} ${getScoreColor(viralScore)}`}>
          <Icon name="FireIcon" size={11} variant="solid" />
          {viralScore}%
        </div>
      </div>
      <div className="p-4 space-y-3">
        {triggers.map((t) => (
          <div key={t.label} className="flex gap-3 items-start">
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mt-0.5">
              <Icon name={t.icon as any} size={13} className={t.color} />
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-[#F7EFE7] mb-0.5">{t.label}</p>
              <p className="text-xs font-sans text-[#6B534E] leading-relaxed">{t.desc}</p>
            </div>
          </div>
        ))}
        <div className="mt-2 p-3 bg-[#FF3D00]/5 border border-[#FF3D00]/10 rounded-xl">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF3D00] font-bold mb-1">📹 Recording Tip — {platform}</p>
          <p className="text-xs font-sans text-[#F7EFE7]/70 leading-relaxed">{tip}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Enhanced Loading Animation ───────────────────────────────────────────────

function LoadingAnimation({ currentStep }: { currentStep: number }) {
  return (
    <div className="card-surface border border-border rounded-2xl p-10 flex flex-col items-center justify-center text-center min-h-[500px]">
      {/* Ping ring + pulsing fire icon */}
      <div className="relative mb-8 flex items-center justify-center">
        {/* Outer ping ring */}
        <span className="absolute w-24 h-24 rounded-full border-2 border-[#FF3D00]/30 animate-ping" />
        {/* Middle ring */}
        <span className="absolute w-16 h-16 rounded-full border border-[#FF3D00]/20 animate-pulse" />
        {/* Inner fire icon */}
        <div className="relative z-10 w-14 h-14 rounded-2xl flame-gradient flex items-center justify-center shadow-lg">
          <Icon name="FireIcon" size={28} className="text-white" variant="solid" />
        </div>
      </div>

      <h3 className="font-display text-xl font-bold text-[#F7EFE7] mb-1">Engineering your viral script…</h3>
      <p className="text-sm font-sans text-[#6B534E] max-w-xs leading-relaxed mb-8">
        Applying 10-year viral psychology framework — parsing visual synchronicity & informational gap theory loops.
      </p>

      {/* Staggered steps */}
      <div className="space-y-2.5 w-full max-w-xs mb-8">
        {LOADING_STEPS.map((step, i) => (
          <div
            key={step}
            className={`flex items-center gap-3 text-sm font-sans transition-all duration-500 ${
              i <= currentStep ? 'text-[#F7EFE7]' : 'text-[#6B534E]'
            }`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
              i < currentStep
                ? 'bg-green-500/20 border border-green-500/40'
                : i === currentStep
                ? 'bg-[#FF3D00]/20 border border-[#FF3D00]/40'
                : 'bg-[#6B534E]/10 border border-[#6B534E]/20'
            }`}>
              {i < currentStep ? (
                <Icon name="CheckIcon" size={11} className="text-green-400" />
              ) : i === currentStep ? (
                <svg className="animate-spin w-3 h-3 text-[#FF3D00]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-[#6B534E]/40" />
              )}
            </div>
            <span>{step}</span>
          </div>
        ))}
      </div>

      {/* Staggered bouncing dots */}
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-[#FF3D00] animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ViralScriptWriterContent() {
  const [mode, setMode] = useState<'create' | 'refine'>('create');
  const [topic, setTopic] = useState('');
  const [refineDraft, setRefineDraft] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('youtube-shorts');
  const [selectedNiche, setSelectedNiche] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const [audienceType, setAudienceType] = useState<string>('Relatable');
  const [customAudience, setCustomAudience] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string>('v1');
  const [history, setHistory] = useState<GeneratedScript[]>([]);
  const [loadingStep, setLoadingStep] = useState(0);

  const resultsRef = useRef<HTMLDivElement>(null);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { response, isLoading, error, sendMessage } = useChat('GEMINI', 'gemini/gemini-2.5-flash-lite', false);

  useEffect(() => {
    if (error) toast.error(error.message);
  }, [error]);

  // Animate loading steps
  useEffect(() => {
    if (isLoading) {
      setLoadingStep(0);
      loadingIntervalRef.current = setInterval(() => {
        setLoadingStep((prev) => Math.min(prev + 1, LOADING_STEPS.length - 1));
      }, 1800);
    } else {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    }
    return () => {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    };
  }, [isLoading]);

  useEffect(() => {
    if (response && !isLoading) {
      const versions = parseScriptResponse(response);
      if (versions.length > 0) {
        const platform = PLATFORMS.find((p) => p.id === selectedPlatform);
        const newScript: GeneratedScript = {
          topic: mode === 'refine' ? 'Refined Draft' : topic,
          platform: platform?.label || selectedPlatform,
          niche: selectedNiche,
          language: selectedLanguage,
          audienceType,
          versions,
          generatedAt: new Date().toISOString(),
        };
        setGeneratedScript(newScript);
        setSelectedVersion('v1');
        setHistory((prev) => [newScript, ...prev.slice(0, 4)]);
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        toast.error('Could not parse script. Please try again.');
      }
    }
  }, [response, isLoading]);

  const handleGenerate = () => {
    if (mode === 'create' && !topic.trim()) {
      toast.error('Please enter a topic first');
      return;
    }
    if (mode === 'refine' && !refineDraft.trim()) {
      toast.error('Please paste your draft first');
      return;
    }

    const platform = PLATFORMS.find((p) => p.id === selectedPlatform);
    const ctaToneGuide =
      selectedLanguage === 'Hindi' ?'Use emotion-first, dramatic high-retention pauses, warm conversational vernacular for the CTA.'
        : selectedLanguage === 'Hinglish' ?'Use casual friend-to-friend tone, blend Hindi expressions with English nouns, frictionless and colloquial CTA.' :'Use punchy, direct, momentum-driven CTA with active high-velocity verbs and short declarative sentences.';

    const platformDuration = platform?.duration || '60s';
    const effectiveAudience = audienceType === 'Other' && customAudience.trim() ? customAudience.trim() : audienceType;

    const createPrompt = `Apply the full NemoScript Viral Psychology system to generate 3 viral video script versions:

TOPIC: ${topic}
PLATFORM: ${platform?.label} (${platformDuration})
NICHE: ${selectedNiche || 'General'}
LANGUAGE: ${selectedLanguage}
TARGET AUDIENCE: ${effectiveAudience}
CTA TONE: ${ctaToneGuide}
${additionalContext ? `ADDITIONAL CONTEXT: ${additionalContext}` : ''}

REQUIRED FRAMEWORK ASSIGNMENT:
- Version 1 (v1): Apply HEARS framework — optimized for relatable & informative content
- Version 2 (v2): Apply PAW framework — optimized for motivational & pain-point content
- Version 3 (v3): Apply C4 framework — optimized for conversion & fast-paced delivery

MANDATORY REQUIREMENTS:
1. Hook MUST be a pattern interrupt — start mid-sentence or mid-action, use curiosity gap
2. rawMarkdown MUST use EXACTLY: "# Scene N: Title", "[Visual Cue]: ...", "[Audio Script]: ...", "CTA: ..."
3. Alternate [Visual Cue] and [Audio Script] for every scene (4–6 scenes per script)
4. End each script with a standalone "CTA: ..." line
5. CTA MUST be a single-action comment-to-DM trigger with value
6. Timestamps must align with ${platform?.label} (${platformDuration}) pacing
7. Delivery notes must specify visual-auditory synchronicity and scene change timing

Generate scripts in ${selectedLanguage} language with appropriate cultural pacing and tone.`;

    const refinePrompt = `Apply the full NemoScript Viral Psychology system to REFINE and RESTRUCTURE this raw draft into 3 viral video script versions:

RAW DRAFT:
${refineDraft}

PLATFORM: ${platform?.label} (${platformDuration})
NICHE: ${selectedNiche || 'General'}
LANGUAGE: ${selectedLanguage}
TARGET AUDIENCE: ${effectiveAudience}
CTA TONE: ${ctaToneGuide}

Extract the core idea from the draft and apply HEARS, PAW, and C4 frameworks.
Follow all rawMarkdown formatting rules: "# Scene N: Title", "[Visual Cue]: ...", "[Audio Script]: ...", "CTA: ..."`;

    sendMessage(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: mode === 'refine' ? refinePrompt : createPrompt },
      ],
      { temperature: 0.85, max_tokens: 4000 }
    );
  };

  const platform = PLATFORMS.find((p) => p.id === selectedPlatform);
  const selectedVersionData = generatedScript?.versions.find((v) => v.id === selectedVersion);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flame-gradient flex items-center justify-center flex-shrink-0">
            <Icon name="PencilSquareIcon" size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Viral Script Writer</h1>
            <p className="text-xs text-muted-foreground font-sans">AI-powered scripts engineered for virality</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono-custom text-primary font-bold">
            <Icon name="SparklesIcon" size={12} variant="solid" />
            Powered by Gemini AI
          </div>
        </div>
      </div>

      <div className="px-6 py-5 max-w-screen-xl mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

          {/* ── Left: Input Panel ── */}
          <div className="xl:col-span-2 space-y-5">

            {/* Mode Toggle Tabs */}
            <div className="card-surface border border-border rounded-2xl p-1.5 flex gap-1">
              <button
                onClick={() => setMode('create')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-sans font-semibold transition-all duration-200 ${
                  mode === 'create' ?'flame-gradient text-white shadow-sm' :'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon name="PlusCircleIcon" size={15} />
                Create New
              </button>
              <button
                onClick={() => setMode('refine')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-sans font-semibold transition-all duration-200 ${
                  mode === 'refine' ?'flame-gradient text-white shadow-sm' :'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon name="WrenchScrewdriverIcon" size={15} />
                Refine Draft
              </button>
            </div>

            {/* Mode A: Create New */}
            {mode === 'create' && (
              <div className="card-surface border border-border rounded-2xl p-5 space-y-4">
                <div>
                  <h2 className="text-sm font-sans font-semibold text-foreground mb-1">Reel Topic / Title</h2>
                  <p className="text-xs text-muted-foreground font-sans">Be specific — better topics generate better scripts</p>
                </div>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Why I quit my 9-to-5 to build a business, The protein mistake costing you gains, 5 AI tools that replaced my entire team..."
                  rows={3}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />

                {/* Target Audience */}
                <div>
                  <label className="text-xs font-mono-custom uppercase tracking-wide text-muted-foreground font-bold mb-2 block">Target Audience</label>
                  <div className="flex flex-wrap gap-1.5">
                    {AUDIENCE_TYPES.map((a) => (
                      <button
                        key={a}
                        onClick={() => setAudienceType(a)}
                        className={`px-3 py-1.5 rounded-full text-xs font-sans font-medium border transition-all duration-150 ${
                          audienceType === a
                            ? 'bg-primary text-white border-primary' :'bg-muted text-muted-foreground border-border hover:text-foreground hover:border-primary/40'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                  {audienceType === 'Other' && (
                    <input
                      type="text"
                      value={customAudience}
                      onChange={(e) => setCustomAudience(e.target.value)}
                      placeholder="e.g. Web3 Developers, Stay-at-home Moms..."
                      className="mt-2 w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Mode B: Refine Draft */}
            {mode === 'refine' && (
              <div className="card-surface border border-border rounded-2xl p-5 space-y-3">
                <div>
                  <h2 className="text-sm font-sans font-semibold text-foreground mb-1">Raw Script Ideas</h2>
                  <p className="text-xs text-muted-foreground font-sans">Paste your rough draft, bullet points, or unstructured ideas</p>
                </div>
                <textarea
                  value={refineDraft}
                  onChange={(e) => setRefineDraft(e.target.value)}
                  placeholder="Paste your rough draft here... e.g.&#10;- Hook: something about money mistakes&#10;- Talk about how I lost 50k&#10;- Solution: the 3 rules I follow now&#10;- CTA: comment MONEY"
                  rows={8}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            )}

            {/* Platform Selection */}
            <div className="card-surface border border-border rounded-2xl p-5 space-y-3">
              <h2 className="text-sm font-sans font-semibold text-foreground">Platform</h2>
              <div className="space-y-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlatform(p.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-sans transition-all duration-150 ${
                      selectedPlatform === p.id
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-muted/50 text-muted-foreground hover:text-foreground hover:border-border/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon name={p.icon as any} size={16} variant={selectedPlatform === p.id ? 'solid' : 'outline'} className={selectedPlatform === p.id ? 'text-primary' : ''} />
                      <span className="font-medium">{p.label}</span>
                    </div>
                    <span className={`text-xs font-mono-custom px-2 py-0.5 rounded-full border ${selectedPlatform === p.id ? p.color : 'text-muted-foreground bg-muted border-border'}`}>
                      {p.duration}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Niche + Language */}
            <div className="card-surface border border-border rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-sans font-semibold text-foreground">Customize</h2>

              {/* Niche */}
              <div>
                <label className="text-xs font-mono-custom uppercase tracking-wide text-muted-foreground font-bold mb-2 block">Niche</label>
                <div className="flex flex-wrap gap-1.5">
                  {NICHES.map((n) => (
                    <button
                      key={n}
                      onClick={() => setSelectedNiche(selectedNiche === n ? '' : n)}
                      className={`px-3 py-1.5 rounded-full text-xs font-sans font-medium border transition-all duration-150 ${
                        selectedNiche === n
                          ? 'bg-primary text-white border-primary' :'bg-muted text-muted-foreground border-border hover:text-foreground hover:border-primary/40'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="text-xs font-mono-custom uppercase tracking-wide text-muted-foreground font-bold mb-2 block">Language</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm font-sans text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Additional context — only in Create mode */}
              {mode === 'create' && (
                <div>
                  <label className="text-xs font-mono-custom uppercase tracking-wide text-muted-foreground font-bold mb-2 block">Additional Context <span className="normal-case font-normal">(optional)</span></label>
                  <textarea
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder="Key points to include, tone preference..."
                    rows={2}
                    className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm font-sans text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isLoading || (mode === 'create' ? !topic.trim() : !refineDraft.trim())}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl flame-gradient text-white font-sans font-bold text-base shadow-flame transition-all duration-200 hover:opacity-90 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {mode === 'refine' ? 'Refining Draft…' : 'Generating Scripts…'}
                </>
              ) : (
                <>
                  <Icon name="SparklesIcon" size={20} variant="solid" />
                  {mode === 'refine' ? 'Refine My Draft' : 'Generate Viral Scripts'}
                </>
              )}
            </button>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Scripts Generated', value: history.length.toString(), icon: 'DocumentTextIcon' },
                { label: 'Platform', value: platform?.label.split(' ')[0] || '—', icon: 'DevicePhoneMobileIcon' },
                { label: 'Language', value: selectedLanguage, icon: 'LanguageIcon' },
              ].map((stat) => (
                <div key={stat.label} className="card-surface border border-border rounded-xl p-3 text-center">
                  <Icon name={stat.icon as any} size={16} className="text-primary mx-auto mb-1" />
                  <p className="text-sm font-mono-custom font-bold text-foreground tabular-nums truncate">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-sans leading-tight mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Results Panel ── */}
          <div className="xl:col-span-3 space-y-5" ref={resultsRef}>

            {!generatedScript && !isLoading && (
              <div className="card-surface border border-border rounded-2xl p-10 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="w-16 h-16 rounded-2xl flame-gradient flex items-center justify-center mb-4 opacity-80">
                  <Icon name="PencilSquareIcon" size={32} className="text-white" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-2">Ready to go viral?</h3>
                <p className="text-sm font-sans text-muted-foreground max-w-xs leading-relaxed">
                  Enter your topic, choose a platform, and let NemoScript apply HEARS, PAW & C4 frameworks with pattern interrupt psychology to craft 3 viral scripts — each broken into scene-by-scene Visual + Audio cards.
                </p>
                <div className="mt-6 grid grid-cols-3 gap-3 w-full max-w-sm">
                  {[
                    { label: 'HEARS · PAW · C4', icon: 'DocumentDuplicateIcon' },
                    { label: 'Scene-by-Scene Cards', icon: 'RectangleStackIcon' },
                    { label: 'Pattern Interrupt Hooks', icon: 'BoltIcon' },
                  ].map((f) => (
                    <div key={f.label} className="p-3 bg-muted rounded-xl text-center">
                      <Icon name={f.icon as any} size={18} className="text-primary mx-auto mb-1.5" />
                      <p className="text-xs font-sans text-muted-foreground leading-tight">{f.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Loading Animation */}
            {isLoading && <LoadingAnimation currentStep={loadingStep} />}

            {generatedScript && !isLoading && (
              <>
                {/* ── Header & Metadata Zone ── */}
                <div className="card-surface border border-border rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-mono-custom uppercase tracking-wide text-primary font-bold bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                          {generatedScript.platform}
                        </span>
                        {generatedScript.niche && (
                          <span className="text-xs font-mono-custom uppercase tracking-wide text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border">
                            {generatedScript.niche}
                          </span>
                        )}
                        <span className="text-xs font-mono-custom uppercase tracking-wide text-[#FFB000] bg-[#FFB000]/10 px-2.5 py-1 rounded-full border border-[#FFB000]/20">
                          {generatedScript.audienceType}
                        </span>
                        <span className="text-xs font-mono-custom uppercase tracking-wide text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border">
                          {generatedScript.language}
                        </span>
                      </div>
                      <h2 className="font-display text-lg font-bold text-foreground leading-snug mt-2">
                        &ldquo;{generatedScript.topic}&rdquo;
                      </h2>
                      <p className="text-xs text-muted-foreground font-sans mt-1">
                        {generatedScript.versions.length} script versions generated · Powered by Gemini AI
                      </p>
                    </div>
                    <button
                      onClick={handleGenerate}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted border border-border text-sm font-sans font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all flex-shrink-0"
                    >
                      <Icon name="ArrowPathIcon" size={14} />
                      Regenerate
                    </button>
                  </div>

                  {/* Best score highlight */}
                  {generatedScript.versions.length > 0 && (
                    <div className="mt-4 p-3 bg-primary/5 border border-primary/15 rounded-xl flex items-center gap-3">
                      <Icon name="TrophyIcon" size={18} className="text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-mono-custom uppercase tracking-wide text-primary font-bold">Top Performing Version</p>
                        <p className="text-sm font-sans text-foreground mt-0.5">
                          <span className="font-semibold">{generatedScript.versions[0].styleLabel}</span>
                          {' '}— Virality score:{' '}
                          <span className={`font-mono-custom font-bold ${getScoreColor(generatedScript.versions[0].viralScore)}`}>
                            {generatedScript.versions[0].viralScore}%
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Audio-Visual Alternation Zone: Script versions ── */}
                <div className="space-y-4">
                  {generatedScript.versions.map((version) => (
                    <ScriptCard
                      key={version.id}
                      version={version}
                      isSelected={selectedVersion === version.id}
                      onSelect={() => setSelectedVersion(version.id)}
                    />
                  ))}
                </div>

                {/* ── Analytical Widgets ── */}
                <RetentionStrategyPanel
                  audienceType={generatedScript.audienceType}
                  language={generatedScript.language}
                />
                <ViralTriggerPanel
                  platform={generatedScript.platform}
                  viralScore={selectedVersionData?.viralScore ?? generatedScript.versions[0]?.viralScore ?? 80}
                />
              </>
            )}

            {/* History */}
            {history.length > 1 && (
              <div className="card-surface border border-border rounded-2xl p-5">
                <h3 className="text-sm font-sans font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Icon name="ClockIcon" size={16} className="text-muted-foreground" />
                  Recent Scripts
                </h3>
                <div className="space-y-2">
                  {history.slice(1).map((h, i) => (
                    <button
                      key={`hist-${i}`}
                      onClick={() => { setGeneratedScript(h); setSelectedVersion('v1'); }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted hover:bg-muted/80 border border-border hover:border-primary/30 transition-all text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-sans font-medium text-foreground truncate">{h.topic}</p>
                        <p className="text-xs text-muted-foreground font-sans">{h.platform} · {h.niche || 'General'}</p>
                      </div>
                      <Icon name="ChevronRightIcon" size={14} className="text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
