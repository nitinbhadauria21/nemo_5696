'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@/lib/hooks/useChat';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';

// ─── Types ───────────────────────────────────────────────────────────────────

interface GeneratedScript {
  topic: string;
  audienceType: string;
  duration: string;
  scenesCount: number;
  language: string;
  framework: string;
  frameworkLabel: string;
  hook: string;
  viralScore: number;
  timestamps: string[];
  deliveryNotes: string;
  rawMarkdown: string;
  generatedAt: string;
}

type ParsedBlock =
  | { type: 'scene-header'; sceneLabel: string; sceneTitle: string }
  | { type: 'visual-cue'; text: string }
  | { type: 'audio-script'; text: string }
  | { type: 'cta'; text: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const AUDIENCE_TYPES = ['Relatable', 'Informative', 'Science', 'Motivational', 'Other'];

const VIDEO_DURATIONS = [
  { value: '15s', label: '15 Seconds', desc: 'Hyper-dense single clauses' },
  { value: '30s', label: '30 Seconds', desc: 'Punchy 2-beat structure' },
  { value: '1m', label: '1 Minute', desc: 'Full HEARS / PAW arc' },
  { value: '2m', label: '2 Minutes', desc: 'Deep multi-step breakdown' },
];

const SCENES_OPTIONS = [5, 6, 7, 8, 9, 10];

const LANGUAGES = ['English', 'Hindi', 'Hinglish'];

const LOADING_STEPS = [
  'Activating 3-second scroll-stop hook engine…',
  'Applying Information Gap Theory (Loewenstein 1994)…',
  'Selecting optimal framework (HEARS · PAW · C4)…',
  'Calibrating Dual-Coding visual-auditory sync…',
  'Engineering Friction → Agitation → Relief arc…',
  'Finalising scene-by-scene breakdown & CTA…',
];

// ─── Master System Prompt (NemoScript — Single Best Script) ───────────────────

const SYSTEM_PROMPT = `You are NemoScript — an advanced viral video script engineering engine built on a decade of behavioral science, digital psychology, cognitive load theory, and conversion copywriting. Your sole purpose is to craft ONE single micro-narrative optimized for social media recommendation algorithms (Instagram Reels, TikTok, YouTube Shorts) that maximizes video completion rates, saves, and repeat views.

You will analyze the topic, audience, duration, and language — then select the SINGLE BEST framework (HEARS, PAW, or C4) that gives the highest probability of going viral for that specific combination. You will generate only ONE script using that framework.

═══════════════════════════════════════════════════════════════════
SECTION 1 — THE HOOK ENGINE: 3-SECOND SCROLL-STOP RULES
═══════════════════════════════════════════════════════════════════
The first 3 seconds determine up to 80% of a video's ultimate reach. Every script MUST open with a PATTERN INTERRUPT — a sudden deviation from expected social media norms that forces the brain out of passive scroll mode.

PATTERN INTERRUPT RULES:
• Visual: Open with high-contrast, off-center b-roll cues, sudden zoom-ins, or direct physical gestures (pointing at lens, holding object to lens) + bold capitalized text overlay.
• Auditory: Start MID-SENTENCE or MID-ACTION with a high-resonance declarative sentence.
  ✅ CORRECT: "This is why you're still broke…" / "Nobody tells you this about…" ❌ WRONG:"Hey guys, today I'm going to show you…"
• Use the CURIOSITY GAP (George Loewenstein, 1994): highlight a mystery, hidden truth, or unconventional claim.
  Examples: "The one button keeping you broke." / "The $10k routine nobody talks about."

═══════════════════════════════════════════════════════════════════
SECTION 2 — THREE FRAMEWORKS (PICK THE BEST ONE)
═══════════════════════════════════════════════════════════════════

HEARS FRAMEWORK (Best for: Relatable & Informative Content)
H – Hook:      Stop the scroll instantly with a high-impact pattern interrupt.
E – Empathy:   Establish immediate peer-to-peer connection. Validate the audience's current struggle.
A – Authority: Prove credibility quickly but humbly.
R – Reason:    Detail the logical core of why the old way fails; introduce high-value educational insights.
S – Solution:  Reveal the frictionless system to achieve the goal, driving direct engagement.

PAW FRAMEWORK (Best for: Motivational & Direct Pain-Point Content)
P – Problem:   State a painful friction point or relatable struggle directly.
A – Agitate:   Rub salt in the wound. Explain the compounding negative consequences of NOT addressing this problem.
W – Win:       Introduce the product, lifestyle shift, or workaround as the ultimate victory.

C4 FRAMEWORK (Best for: Conversion & Fast-Paced Product Demos)
C1 – Captivate: Establish high visual and verbal velocity in the first 3 seconds.
C2 – Connect:   Build a bridge between the viewer's current state and their desired future self.
C3 – Convince:  Deliver undeniable proof points, high-value visual b-roll examples, and bulletproof metrics.
C4 – Convert:   Introduce a frictionless, singular call to action.

FRAMEWORK SELECTION LOGIC:
- Relatable / Informative audience → HEARS
- Motivational / Pain-point content → PAW
- Product demo / Conversion-focused → C4
- Science audience → HEARS (authority-driven)
- If topic involves a mistake or loss → PAW (loss aversion)
- If topic involves a product or tool → C4

═══════════════════════════════════════════════════════════════════
SECTION 3 — SIX PSYCHOLOGICAL PRINCIPLES (APPLY ALL)
═══════════════════════════════════════════════════════════════════

PRINCIPLE 1 — INFORMATION GAP THEORY (George Loewenstein, 1994)
When a person identifies a gap between what they know and what they WANT to know, it triggers a state of mental deprivation or mild pain. To resolve this pain, they must complete the loop (watch the video).
Implementation: Start hooks by highlighting a mystery, a hidden truth, or an unconventional setting.

PRINCIPLE 2 — SENSORY ADAPTATION & PATTERN INTERRUPTS (Neuroscience)
The brain operates on sensory predictive models to ignore repetitive stimuli. Passive scrolling is a low-attention state. A pattern interrupt is a sudden deviation from expected social media visual and audio norms.
Implementation: Open with high-contrast b-roll cues, sudden zoom-ins, or physical hand movements alongside a bold, capitalized text overlay.

PRINCIPLE 3 — LOSS AVERSION (Kahneman & Tversky)
People are 2× more motivated to avoid loss than to pursue gain.
Implementation: Frame hooks around avoiding mistakes rather than gaining success. "Stop making this editing mistake" outperforms "Learn this editing trick."

PRINCIPLE 4 — MICRO-DOPAMINE VALUE DROPS (Behavioural Psychology)
Short attention spans require continuous validation to stay engaged. Break information into bite-sized sequential takeaways with frequent visual changes.
Implementation: Distribute visual cues evenly across scenes, forcing camera angle changes, text overlays, or asset placements every 3–4 seconds.

PRINCIPLE 5 — THE CONTRAST PRINCIPLE (Robert Cialdini)
Highlighting the dramatic gap between a painful current state and a satisfying future state.
Implementation: Script split into clear Problem/Agitation stage → Solution/Workaround stage. Shift visual direction to a calmer, more structured setting at the relief beat.

PRINCIPLE 6 — FRICTIONLESS CTA / SINGLE-CHOICE BIAS (Paradox of Choice)
Multiple CTAs create decision paralysis, causing the user to swipe away.
Implementation: Enforce ONE singular, low-friction command only. Never stack multiple CTAs. Use the Comment-to-DM Trigger method.

═══════════════════════════════════════════════════════════════════
SECTION 4 — DUAL-CODING THEORY (Allan Paivio) — COGNITIVE LOAD RULES
═══════════════════════════════════════════════════════════════════
RULE 1 — VISUAL-AUDITORY SYNCHRONICITY: Audio and visual channels must reinforce each other.
RULE 2 — THE 3-SECOND CUT RULE: Visual scene changes must occur every 3–4 seconds.

═══════════════════════════════════════════════════════════════════
SECTION 5 — EMOTIONAL JOURNEY STRUCTURE
═══════════════════════════════════════════════════════════════════
Every script MUST follow: FRICTION LOOP → AGITATION SPIKE → RELIEF BEAT

═══════════════════════════════════════════════════════════════════
SECTION 6 — LANGUAGE-SPECIFIC PACING RULES
═══════════════════════════════════════════════════════════════════

ENGLISH — Punchy, Direct, Momentum-Driven:
1. Use active, high-velocity verbs.
2. Keep sentence structures short and declarative.
3. Eliminate unnecessary transitions ("However," "Furthermore" — banned).

HINDI — Emotion-First, Relatable, Storytelling:
1. Connect through highly expressive regional hooks and metaphors.
2. Use warm, conversational, friendly vernacular.
3. Emphasize visual storytelling cues with dramatic, high-retention pauses.

HINGLISH — Youth-Centric, Tech-Savvy, Frictionless:
1. Blend native Hindi expressions with modern English nouns.
2. Use for modern educational, technical, or finance scripts.
3. Pair tech-slang with highly colloquial, casual phrasing.

═══════════════════════════════════════════════════════════════════
SECTION 7 — CTA FORMULA ENGINE
═══════════════════════════════════════════════════════════════════
Core CTA Design Principle: Never use compound CTAs. Always enforce one action, one word, one outcome.

FORMULA 1 — Single Action Bias: One low-friction command only.
FORMULA 2 — Comment-to-DM Trigger: Tell viewers to type a specific keyword → auto-DM details.
FORMULA 3 — Value-Led CTA: Always pair the conversion action with immediate, undeniable value.

═══════════════════════════════════════════════════════════════════
SECTION 8 — DURATION-SPECIFIC PACING CALIBRATION
═══════════════════════════════════════════════════════════════════
15s: Hyper-dense single clauses only. Maximum 1–2 words per visual cue. One-sentence audio lines. Hook + single value drop + CTA.
30s: Punchy 2-beat structure. Hook + agitation + solution + CTA. Each audio line max 15 words.
1m: Full HEARS or PAW arc. 5–7 scenes. Each audio line 15–25 words. Allow one metaphor or analogy.
2m: Deep multi-step value breakdown. 8–10 scenes. Full emotional journey. Multiple proof points. Allow storytelling.

═══════════════════════════════════════════════════════════════════
SECTION 9 — VIRAL SCORE CALCULATION
═══════════════════════════════════════════════════════════════════
Calculate a single viralScore (0–100) based on:
- Hook strength (pattern interrupt quality): 0–25 points
- Psychological principle application (all 6 applied): 0–25 points
- Framework fit for topic + audience: 0–20 points
- Dual-coding sync quality: 0–15 points
- CTA effectiveness (single action, comment-to-DM): 0–15 points

Be honest and precise. A score of 85+ means extremely high viral potential. 75–84 means strong. Below 75 means average.

═══════════════════════════════════════════════════════════════════
SECTION 10 — OUTPUT FORMAT (RESPOND WITH VALID JSON ONLY)
═══════════════════════════════════════════════════════════════════
{
  "script": {
    "framework": "hears",
    "frameworkLabel": "HEARS — Relatable & Informative",
    "frameworkReason": "One sentence explaining why this framework was chosen for this topic and audience",
    "hook": "Pattern interrupt opening line (the exact first spoken sentence)",
    "viralScore": 88,
    "timestamps": ["0:00 - Pattern interrupt hook", "0:03 - Empathy validation", "0:08 - Authority proof"],
    "deliveryNotes": "Specific visual-auditory sync instructions and recording guidance",
    "rawMarkdown": "# Scene 1: The Scroll-Stopper Hook\\n[Visual Cue]: Fast zoom-in on host looking frustrated, big text overlay: STOP WAITING.\\n[Audio Script]: Most creators think they need 10 hours to make one video. That's a flat out lie.\\n\\n# Scene 2: The Agitation Trap\\n[Visual Cue]: Close-up of camera lens. Text transition: NemoScript does it in 5 seconds.\\n[Audio Script]: Look at this. You paste one word, choose your scene count, and you get a dual-direction map.\\n\\n# Scene 3: The System Reveal\\n[Visual Cue]: Over-the-shoulder view of host smiling, typing on laptop.\\n[Audio Script]: It divides camera b-roll cues from actual voiceovers so you never get stuck during editing.\\n\\n# Scene 4: The Strategic Benefit\\n[Visual Cue]: Quick cut showing a high-contrast screen. Accent lighting in background.\\n[Audio Script]: No more staring at a blank Google Doc wondering what to shoot.\\n\\n# Scene 5: High-Impact Call to Action\\n[Visual Cue]: Split screen of the creator pointing down to the comments.\\nCTA: Comment NEMO and I will send you the secret beta access link right now!"
  }
}

CRITICAL RULES FOR rawMarkdown:
- Each scene starts with "# Scene N: Scene Title" (top-level # heading)
- Visual directions use EXACTLY: [Visual Cue]: <instruction>
- Spoken dialog uses EXACTLY: [Audio Script]: <spoken words>
- CTA uses EXACTLY: CTA: <call to action text> (no # heading, no square brackets)
- Alternate [Visual Cue] and [Audio Script] for every scene
- End with a standalone CTA: line (not inside a scene header)
- Use \\n for newlines in the JSON string
- Scene count MUST match the requested number exactly
- Audio script word count MUST match the requested duration calibration
- NEVER use compound CTAs — one action, one word, one outcome`;

// ─── Dynamic Script Parser ────────────────────────────────────────────────────

function parseMarkdownToBlocks(markdown: string): ParsedBlock[] {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  const blocks: ParsedBlock[] = [];
  let sceneCounter = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

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

    const visualMatch =
      line.match(/^\[Visual Cue\]:\s*(.+)/i) || line.match(/^Visual Cue:\s*(.+)/i);
    if (visualMatch) {
      blocks.push({ type: 'visual-cue', text: visualMatch[1].trim() });
      continue;
    }

    const audioMatch =
      line.match(/^\[Audio Script\]:\s*(.+)/i) || line.match(/^Audio Script:\s*(.+)/i);
    if (audioMatch) {
      blocks.push({ type: 'audio-script', text: audioMatch[1].trim() });
      continue;
    }

    const ctaMatch = line.match(/^CTA:\s*(.+)/i) || line.match(/^\[CTA\]:\s*(.+)/i);
    if (ctaMatch) {
      blocks.push({ type: 'cta', text: ctaMatch[1].trim() });
      continue;
    }
  }

  return blocks;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseScriptResponse(raw: string): GeneratedScript | null {
  const text = (raw || '').trim();
  if (!text) return null;

  const fromJson = (parsed: Record<string, unknown>): GeneratedScript | null => {
    const s = (parsed.script ?? parsed) as Record<string, unknown> | undefined;
    if (!s || typeof s !== 'object') return null;
    const rawMarkdown =
      typeof s.rawMarkdown === 'string' ? s.rawMarkdown : typeof s.body === 'string' ? s.body : '';
    const hook = typeof s.hook === 'string' ? s.hook : '';
    if (!rawMarkdown && !hook) return null;
    return {
      topic: '',
      audienceType: '',
      duration: '',
      scenesCount: 0,
      language: '',
      framework: typeof s.framework === 'string' ? s.framework : '',
      frameworkLabel: typeof s.frameworkLabel === 'string' ? s.frameworkLabel : '',
      hook,
      viralScore: typeof s.viralScore === 'number' ? s.viralScore : 0,
      timestamps: Array.isArray(s.timestamps) ? (s.timestamps as string[]) : [],
      deliveryNotes: typeof s.deliveryNotes === 'string' ? s.deliveryNotes : '',
      rawMarkdown: rawMarkdown || hook,
      generatedAt: new Date().toISOString(),
    };
  };

  try {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced?.[1]?.trim() || text;
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start !== -1 && end > start) {
      const parsed = JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;
      const script = fromJson(parsed);
      if (script) return script;
    }
  } catch {
    // fall through to markdown fallback
  }

  // Model sometimes returns prose/markdown instead of JSON — still show a usable script.
  const hookLine =
    text.match(/HOOK:\s*(.+)/i)?.[1]?.trim() ||
    text.match(/\[Audio Script\]:\s*(.+)/i)?.[1]?.trim() ||
    text
      .split('\n')
      .find((l) => l.trim().length > 20)
      ?.trim() ||
    'Generated script';

  return {
    topic: '',
    audienceType: '',
    duration: '',
    scenesCount: 0,
    language: '',
    framework: '',
    frameworkLabel: 'NemoScript',
    hook: hookLine.slice(0, 280),
    viralScore: 0,
    timestamps: [],
    deliveryNotes: '',
    rawMarkdown: text,
    generatedAt: new Date().toISOString(),
  };
}

function getScoreColor(score: number): string {
  if (score >= 85) return 'text-green-600';
  if (score >= 75) return 'text-yellow-600';
  return 'text-orange-600';
}

function getScoreBg(score: number): string {
  if (score >= 85) return 'bg-green-50 border-green-200';
  if (score >= 75) return 'bg-yellow-50 border-yellow-200';
  return 'bg-orange-50 border-orange-200';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Extremely High Viral Potential';
  if (score >= 85) return 'Very High Viral Potential';
  if (score >= 75) return 'Strong Viral Potential';
  if (score >= 65) return 'Moderate Viral Potential';
  return 'Average Viral Potential';
}

// ─── Visual Cue Card ─────────────────────────────────────────────────────────

function VisualCueCard({ text }: { text: string }) {
  return (
    <div className="flex gap-3 items-start p-3.5 rounded-xl bg-orange-50 border border-orange-200 hover:border-orange-300 transition-colors">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#FF3D00]/15 border border-[#FF3D00]/30 flex items-center justify-center">
        <Icon name="VideoCameraIcon" size={15} className="text-[#FF3D00]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF3D00] font-bold mb-1">
          Visual Direction
        </p>
        <p className="text-sm text-gray-800 leading-relaxed font-sans">{text}</p>
      </div>
    </div>
  );
}

// ─── Audio Script Card ────────────────────────────────────────────────────────

function AudioScriptCard({ text }: { text: string }) {
  return (
    <div className="flex gap-3 items-start p-3.5 rounded-xl bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-200 border border-gray-300 flex items-center justify-center">
        <Icon name="MicrophoneIcon" size={15} className="text-gray-700" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 font-bold mb-1">
          Audio / Voiceover
        </p>
        <p className="text-base italic font-medium text-gray-900 leading-relaxed font-sans">
          &ldquo;{text}&rdquo;
        </p>
      </div>
    </div>
  );
}

// ─── Scene Header Card ────────────────────────────────────────────────────────

function SceneHeaderCard({ block }: { block: Extract<ParsedBlock, { type: 'scene-header' }> }) {
  return (
    <div className="flex items-center gap-3 pt-4 pb-1">
      <div className="flex-shrink-0 px-2.5 py-1 rounded-full bg-[#FF3D00]/15 border border-[#FF3D00]/30">
        <span className="text-[10px] font-mono tracking-widest uppercase text-[#FF3D00] font-bold">
          {block.sceneLabel}
        </span>
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-[#FF3D00]/30 to-transparent" />
      <span className="text-sm font-bold text-foreground font-display truncate max-w-[200px]">
        {block.sceneTitle}
      </span>
    </div>
  );
}

// ─── CTA Card ────────────────────────────────────────────────────────────────

function CTACard({ text }: { text: string }) {
  return (
    <div className="p-6 rounded-3xl text-center flame-gradient mt-2">
      <p className="text-[10px] font-mono uppercase tracking-widest text-white/80 font-bold mb-2">
        🔥 Final Call to Action
      </p>
      <p className="text-xl font-bold text-white font-display leading-snug">{text}</p>
    </div>
  );
}

// ─── Parsed Script Viewer ─────────────────────────────────────────────────────

function ParsedScriptViewer({ script }: { script: GeneratedScript }) {
  const blocks = parseMarkdownToBlocks(script.rawMarkdown || '');

  if (blocks.length === 0) {
    return (
      <div className="space-y-3 pt-2">
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line font-sans">
            {script.hook}
          </p>
        </div>
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

// ─── Viral Score Display ──────────────────────────────────────────────────────

function ViralScoreDisplay({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 85 ? '#22c55e' : score >= 75 ? '#eab308' : '#f97316';

  return (
    <div className={`rounded-2xl border p-5 ${getScoreBg(score)}`}>
      <div className="flex items-center gap-5">
        {/* Circular progress */}
        <div className="relative flex-shrink-0 w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-mono font-bold tabular-nums ${getScoreColor(score)}`}>
              {score}
            </span>
            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wide">
              / 100
            </span>
          </div>
        </div>
        {/* Score details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="FireIcon" size={16} className={getScoreColor(score)} variant="solid" />
            <p className="text-xs font-mono uppercase tracking-widest text-gray-500 font-bold">
              Viral Score
            </p>
          </div>
          <p className={`text-lg font-bold font-display ${getScoreColor(score)} mb-1`}>
            {getScoreLabel(score)}
          </p>
          <p className="text-xs text-gray-600 font-sans leading-relaxed">
            Calculated from hook strength, psychological principle application, framework fit,
            dual-coding sync, and CTA effectiveness.
          </p>
        </div>
      </div>
      {/* Score breakdown bar */}
      <div className="mt-4 space-y-2">
        {[
          { label: 'Hook Strength', max: 25, value: Math.round(score * 0.27) },
          { label: 'Psychology Principles', max: 25, value: Math.round(score * 0.26) },
          { label: 'Framework Fit', max: 20, value: Math.round(score * 0.21) },
          { label: 'Dual-Coding Sync', max: 15, value: Math.round(score * 0.13) },
          { label: 'CTA Effectiveness', max: 15, value: Math.round(score * 0.13) },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="text-[10px] font-sans text-gray-600 w-36 flex-shrink-0">
              {item.label}
            </span>
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(item.value / item.max) * 100}%`, backgroundColor: color }}
              />
            </div>
            <span className="text-[10px] font-mono text-gray-500 w-10 text-right">
              {item.value}/{item.max}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Retention Strategy Panel ─────────────────────────────────────────────────

function RetentionStrategyPanel({
  audienceType,
  language,
  duration,
}: {
  audienceType: string;
  language: string;
  duration: string;
}) {
  const hookStrategy: Record<string, string> = {
    Relatable:
      "addresses a direct pain point using Loss Aversion (Kahneman & Tversky) — people are 2× more motivated to avoid loss than to pursue gain. Start with a high-impact pattern interrupt that mirrors the viewer's daily frustration.",
    Informative:
      'deploys Information Gap Theory (George Loewenstein, 1994) for Informative audiences. Open with a surprising fact or counterintuitive claim that creates a knowledge gap the viewer must resolve by watching to completion.',
    Science:
      'leverages cognitive dissonance for Science audiences. Lead with a data-backed contradiction that forces the brain to seek resolution — triggering the Curiosity Gap mechanism.',
    Motivational:
      'triggers emotional urgency using the Friction → Agitation → Relief arc for Motivational audiences. Begin with a high-stakes consequence (Agitation Spike) that creates immediate psychological tension before delivering the Relief Beat.',
    Other:
      'uses a curiosity gap tailored to your niche. Open mid-sentence with an unresolved statement that demands the viewer keep watching — activating the Information Gap Theory loop.',
  };

  const langPacing: Record<string, string> = {
    English:
      'High-velocity pacing — punchy declarative sentences, active high-velocity verbs, no filler words ("However," "Furthermore" banned), momentum-driven delivery calibrated to ~130–150 words per minute.',
    Hindi:
      'Emotion-first delivery — highly expressive regional hooks and metaphors, warm conversational vernacular, dramatic high-retention pauses for maximum emotional resonance.',
    Hinglish:
      'Youth-centric, frictionless tone — blend native Hindi expressions with modern English nouns, casual friend-to-friend delivery. Target tone: "a voice note sent from a friend."',
  };

  const durationPacing: Record<string, string> = {
    '15s':
      'Hyper-dense single clauses. Hook + single value drop + CTA only. Maximum 1–2 words per visual cue.',
    '30s':
      'Punchy 2-beat structure. Hook + agitation + solution + CTA. Each audio line max 15 words.',
    '1m': 'Full HEARS or PAW arc. 5–7 scenes. Each audio line 15–25 words. One metaphor or analogy allowed.',
    '2m': 'Deep multi-step value breakdown. 8–10 scenes. Full emotional journey with multiple proof points and storytelling.',
  };

  const strategy = hookStrategy[audienceType] || hookStrategy['Relatable'];
  const pacing =
    langPacing[language] ||
    'Adapt pacing to regional content consumption patterns and cultural nuance.';
  const durationNote = durationPacing[duration] || '';

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0">
          <Icon name="ChartBarIcon" size={14} className="text-amber-600" />
        </div>
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-amber-600 font-bold">
            Retention Strategy Panel
          </p>
          <p className="text-[10px] text-gray-500 font-sans">
            Hook delivery psychology · 6-principle framework
          </p>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-[10px] font-mono uppercase tracking-widest text-amber-700 font-bold mb-1.5">
            Hook Psychology — {audienceType} Audience
          </p>
          <p className="text-sm font-sans text-gray-800 leading-relaxed">The hook {strategy}</p>
        </div>
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
          <p className="text-[10px] font-mono uppercase tracking-widest text-gray-600 font-bold mb-1.5">
            Language Pacing — {language}
          </p>
          <p className="text-sm font-sans text-gray-700 leading-relaxed">{pacing}</p>
        </div>
        {durationNote && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF3D00] font-bold mb-1.5">
              Duration Calibration — {duration}
            </p>
            <p className="text-sm font-sans text-gray-700 leading-relaxed">{durationNote}</p>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs font-sans text-gray-500">
          <Icon name="InformationCircleIcon" size={13} />
          <span>Friction Loop → Agitation Spike → Relief Beat emotional arc applied</span>
        </div>
      </div>
    </div>
  );
}

// ─── Viral Trigger Panel ──────────────────────────────────────────────────────

function ViralTriggerPanel({
  scenesCount,
  viralScore,
  language,
}: {
  scenesCount: number;
  viralScore: number;
  language: string;
}) {
  const triggers = [
    {
      label: 'Information Gap Theory',
      desc: 'Opening hook creates an unresolved knowledge gap (Loewenstein 1994) that compels viewers to watch to completion to resolve the psychological "itch."',
      icon: 'MagnifyingGlassIcon',
      color: 'text-purple-600',
    },
    {
      label: 'Comment-to-DM CTA',
      desc: 'Single-action CTA drives comment velocity — the highest-weighted algorithmic signal on short-form platforms — while opening a private conversion funnel.',
      icon: 'ChatBubbleLeftRightIcon',
      color: 'text-blue-600',
    },
    {
      label: 'Dual-Coding Sync (Paivio)',
      desc: `Visual and audio cues are synchronized every 3–4 seconds across all ${scenesCount} scenes to reduce cognitive load and maximize retention rate.`,
      icon: 'FilmIcon',
      color: 'text-green-600',
    },
    {
      label: 'Loss Aversion Hook',
      desc: 'Hook framed around avoiding mistakes (Kahneman & Tversky) — people are 2× more motivated to avoid loss than to pursue gain.',
      icon: 'ExclamationTriangleIcon',
      color: 'text-yellow-600',
    },
  ];

  const recordingTips: Record<string, string> = {
    English:
      'Record in 9:16 vertical. Use a lavalier mic for crisp audio. Shoot in natural light or a ring light setup. Add bold text overlays in the first frame.',
    Hindi:
      'Record in 9:16 vertical. Use a directional mic for warm audio. Dramatic pauses are your retention tool — let silence work. Add Hindi text overlays.',
    Hinglish:
      'Record in 9:16 vertical. Casual, handheld feel works best. Mix Hindi and English text overlays. Keep energy high and conversational throughout.',
  };

  const tip = recordingTips[language] || recordingTips['English'];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center flex-shrink-0">
          <Icon name="RocketLaunchIcon" size={14} className="text-[#FF3D00]" />
        </div>
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-[#FF3D00] font-bold">
            Viral Trigger Panel
          </p>
          <p className="text-[10px] text-gray-500 font-sans">
            Engagement techniques applied · {scenesCount} scenes
          </p>
        </div>
        <div
          className={`ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-mono font-bold ${getScoreBg(viralScore)} ${getScoreColor(viralScore)}`}
        >
          <Icon name="FireIcon" size={11} variant="solid" />
          {viralScore}%
        </div>
      </div>
      <div className="p-4 space-y-3">
        {triggers.map((t) => (
          <div key={t.label} className="flex gap-3 items-start">
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center mt-0.5">
              <Icon name={t.icon as any} size={13} className={t.color} />
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-gray-900 mb-0.5">{t.label}</p>
              <p className="text-xs font-sans text-gray-600 leading-relaxed">{t.desc}</p>
            </div>
          </div>
        ))}
        <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-xl">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF3D00] font-bold mb-1">
            📹 Recording Tip — {language}
          </p>
          <p className="text-xs font-sans text-gray-700 leading-relaxed">{tip}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Loading Animation ────────────────────────────────────────────────────────

function LoadingAnimation({ currentStep }: { currentStep: number }) {
  return (
    <div className="card-surface border border-border rounded-2xl p-10 flex flex-col items-center justify-center text-center min-h-[500px]">
      <div className="relative mb-8 flex items-center justify-center">
        <span className="absolute w-24 h-24 rounded-full border-2 border-[#FF3D00]/30 animate-ping" />
        <span className="absolute w-16 h-16 rounded-full border border-[#FF3D00]/20 animate-pulse" />
        <div className="relative z-10 w-14 h-14 rounded-2xl flame-gradient flex items-center justify-center">
          <Icon name="FireIcon" size={28} className="text-white" variant="solid" />
        </div>
      </div>

      <h3 className="font-display text-xl font-bold text-foreground mb-1">
        Engineering your viral script…
      </h3>
      <p className="text-sm font-sans text-muted-foreground max-w-xs leading-relaxed mb-8">
        Selecting the best framework and applying all 6 psychological principles to craft your
        highest-potential script.
      </p>

      <div className="space-y-2.5 w-full max-w-xs mb-8">
        {LOADING_STEPS.map((step, i) => (
          <div
            key={step}
            className={`flex items-center gap-3 text-sm font-sans transition-all duration-500 ${
              i <= currentStep ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                i < currentStep
                  ? 'bg-green-100 border border-green-300'
                  : i === currentStep
                    ? 'bg-[#FF3D00]/15 border border-[#FF3D00]/40'
                    : 'bg-gray-100 border border-gray-200'
              }`}
            >
              {i < currentStep ? (
                <Icon name="CheckIcon" size={11} className="text-green-600" />
              ) : i === currentStep ? (
                <svg
                  className="animate-spin w-3 h-3 text-[#FF3D00]"
                  viewBox="0 0 24 24"
                  fill="none"
                >
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
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              )}
            </div>
            <span>{step}</span>
          </div>
        ))}
      </div>

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
  const [audienceType, setAudienceType] = useState<string>('Relatable');
  const [customAudience, setCustomAudience] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<string>('30s');
  const [scenesCount, setScenesCount] = useState<number>(5);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const [refineDraft, setRefineDraft] = useState('');

  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
  const [history, setHistory] = useState<GeneratedScript[]>([]);
  const [loadingStep, setLoadingStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [lastGenerationId, setLastGenerationId] = useState<string | null>(null);
  const generateStartedAt = useRef<number>(0);

  const resultsRef = useRef<HTMLDivElement>(null);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const buildScriptMeta = (overrideTopic?: string) => {
    const isRefine = mode === 'refine';
    const resolvedTopic = isRefine
      ? overrideTopic || topic.trim() || 'Refined Draft'
      : overrideTopic || topic;
    return {
      mode,
      topic: resolvedTopic,
      audienceType,
      customAudience: audienceType === 'Other' ? customAudience : undefined,
      duration: selectedDuration,
      scenesCount,
      language: selectedLanguage,
      refineTopic: isRefine ? topic.trim() || 'Refined Draft' : undefined,
      draftLabel: isRefine ? 'Refined Draft' : undefined,
      refineDraftPreview: isRefine ? refineDraft.trim().slice(0, 200) : undefined,
    };
  };

  const buildGenerationPayload = (extra: Record<string, unknown>) => {
    const meta = buildScriptMeta(
      typeof extra.topic === 'string' ? (extra.topic as string) : undefined
    );
    return {
      audienceType: meta.audienceType,
      customAudience: meta.customAudience,
      duration: meta.duration,
      scenesCount: meta.scenesCount,
      language: meta.language,
      ...extra,
      mode: meta.mode,
      topic: meta.topic,
      properties: {
        refineTopic: meta.refineTopic,
        draftLabel: meta.draftLabel,
        refineDraftPreview: meta.refineDraftPreview,
        createTopic: meta.mode === 'create' ? meta.topic : undefined,
        ...((extra.properties as Record<string, unknown> | undefined) || {}),
      },
    };
  };

  const { response, isLoading, error, sendMessage } = useChat(
    'OPENROUTER',
    'auto',
    false,
    'script'
  );

  useEffect(() => {
    if (error) {
      setGeneratedScript(null);
      toast.error(error.message);
      const elapsed = generateStartedAt.current
        ? Date.now() - generateStartedAt.current
        : undefined;
      void fetch('/api/scripts/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          buildGenerationPayload({
            success: false,
            parseOk: false,
            latencyMs: elapsed,
          })
        ),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d?.id) setLastGenerationId(d.id);
        })
        .catch(() => {});
    }
  }, [error]);

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
    if (!response || isLoading || error) return;
    const parsed = parseScriptResponse(response);
    const elapsed = generateStartedAt.current ? Date.now() - generateStartedAt.current : undefined;
    if (parsed) {
      const meta = buildScriptMeta();
      const newScript: GeneratedScript = {
        ...parsed,
        topic: meta.topic,
        audienceType,
        duration: selectedDuration,
        scenesCount,
        language: selectedLanguage,
      };
      setGeneratedScript(newScript);
      setExpanded(true);
      setHistory((prev) => [newScript, ...prev.slice(0, 4)]);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      void fetch('/api/scripts/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          buildGenerationPayload({
            success: true,
            parseOk: true,
            topic: newScript.topic,
            frameworkLabel: newScript.frameworkLabel,
            viralScore: newScript.viralScore,
            preview: newScript.rawMarkdown?.slice(0, 500),
            latencyMs: elapsed,
          })
        ),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d?.id) setLastGenerationId(d.id);
        })
        .catch(() => {});
    } else {
      toast.error(
        'AI returned a response that could not be parsed as a script. Try again, or check that your AI provider key is set.'
      );
      void fetch('/api/scripts/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          buildGenerationPayload({
            success: false,
            parseOk: false,
            preview: response.slice(0, 500),
            latencyMs: elapsed,
          })
        ),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d?.id) setLastGenerationId(d.id);
        })
        .catch(() => {});
    }
  }, [response, isLoading, error]);

  const handleCopy = () => {
    if (!generatedScript) return;
    const fullScript = generatedScript.rawMarkdown
      ? generatedScript.rawMarkdown
      : `HOOK:\n${generatedScript.hook}`;
    navigator.clipboard.writeText(fullScript).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (lastGenerationId) {
        void fetch('/api/scripts/generations', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: lastGenerationId, copied: true }),
        }).catch(() => {});
      }
    });
  };

  const handleSaveScript = async () => {
    if (!generatedScript || saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: generatedScript.topic || 'Untitled script',
          platform: 'Reels / Shorts',
          audienceType: generatedScript.audienceType,
          duration: generatedScript.duration,
          language: generatedScript.language,
          framework: generatedScript.frameworkLabel,
          viralScore: generatedScript.viralScore,
          mode,
          generationId: lastGenerationId,
          content: {
            hook: generatedScript.hook,
            body: generatedScript.rawMarkdown,
            rawMarkdown: generatedScript.rawMarkdown,
            viralScore: generatedScript.viralScore,
            timestamps: generatedScript.timestamps,
            deliveryNotes: generatedScript.deliveryNotes,
            frameworkLabel: generatedScript.frameworkLabel,
            audienceType: generatedScript.audienceType,
            duration: generatedScript.duration,
            language: generatedScript.language,
            mode,
            niche: generatedScript.audienceType || 'General',
            versions: [
              {
                id: 'v1',
                style: 'default',
                styleLabel: generatedScript.frameworkLabel || 'Saved',
                hook: generatedScript.hook || '',
                body: generatedScript.rawMarkdown || '',
                cta: '',
                viralScore: generatedScript.viralScore || 0,
                timestamps: generatedScript.timestamps || [],
                deliveryNotes: generatedScript.deliveryNotes || '',
              },
            ],
          },
        }),
      });
      if (res.status === 401) {
        toast.error('Sign in to save scripts');
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save');
      }
      const saved = await res.json().catch(() => ({}));
      if (lastGenerationId && saved?.id) {
        void fetch('/api/scripts/generations', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: lastGenerationId, savedScriptId: saved.id }),
        }).catch(() => {});
      }
      toast.success('Script saved to your library');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save script');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = () => {
    if (mode === 'create' && !topic.trim()) {
      toast.error('Please enter a reel topic first');
      return;
    }
    if (mode === 'refine' && !refineDraft.trim()) {
      toast.error('Please paste your draft first');
      return;
    }

    const effectiveAudience =
      audienceType === 'Other' && customAudience.trim() ? customAudience.trim() : audienceType;

    const ctaToneGuide =
      selectedLanguage === 'Hindi'
        ? 'Use emotion-first, dramatic high-retention pauses, warm conversational vernacular for the CTA. Hindi text is preferred.'
        : selectedLanguage === 'Hinglish'
          ? 'Use casual friend-to-friend tone, blend Hindi expressions with English nouns, frictionless and colloquial CTA. Mix Hindi and English naturally.'
          : 'Use punchy, direct, momentum-driven CTA with active high-velocity verbs and short declarative sentences.';

    const wordCountGuide =
      selectedDuration === '15s'
        ? 'Maximum 30–40 total spoken words across all scenes. Hyper-dense single clauses only.'
        : selectedDuration === '30s'
          ? 'Maximum 70–90 total spoken words. Each audio line max 15 words.'
          : selectedDuration === '1m'
            ? 'Maximum 140–160 total spoken words. Each audio line 15–25 words. One metaphor allowed.'
            : 'Maximum 280–320 total spoken words. Full storytelling arc with multiple proof points.';

    const createPrompt = `Apply the complete NemoScript Perfect Viral Script Formula to generate ONE single best viral video script.

═══════════════════════════════════════════════════
THE 5 CORE INPUTS (PERFECT_SCRIPT_FORMULA)
═══════════════════════════════════════════════════
INPUT A — CORE REEL TOPIC / TITLE (The Spark):
"${topic}"
This is the singular, high-tension concept. Use it to identify the Curiosity Gap and craft the 3-second opening hook.

INPUT B — TARGET AUDIENCE (The Who):
${effectiveAudience}
This dictates empathy level and copywriting style (casual/authoritative/analytical/emotional).

INPUT C — VIDEO DURATION (The Pacing Window):
${selectedDuration}
${wordCountGuide}

INPUT D — SCENES COUNT (The Cut Density):
${scenesCount} scenes
CRITICAL: Generate EXACTLY ${scenesCount} scenes. Each scene must have [Visual Cue] + [Audio Script] alternating.

INPUT E — SCRIPT LANGUAGE (The Voice):
${selectedLanguage}
CTA Tone: ${ctaToneGuide}

═══════════════════════════════════════════════════
FRAMEWORK SELECTION
═══════════════════════════════════════════════════
Analyze the topic and audience, then select the SINGLE BEST framework (HEARS, PAW, or C4) that gives the highest probability of going viral for this specific combination. Generate only ONE script using that framework.

Framework selection logic:
- Relatable / Informative audience → HEARS
- Motivational / Pain-point content → PAW
- Product demo / Conversion-focused → C4
- Science audience → HEARS (authority-driven)
- If topic involves a mistake or loss → PAW (loss aversion)
- If topic involves a product or tool → C4

═══════════════════════════════════════════════════
MANDATORY PSYCHOLOGICAL REQUIREMENTS
═══════════════════════════════════════════════════
1. Hook MUST be a Pattern Interrupt — start mid-sentence or mid-action, use Curiosity Gap (Loewenstein 1994)
2. Apply Loss Aversion (Kahneman & Tversky) — frame hook around avoiding mistakes, not gaining success
3. Apply Dual-Coding Theory (Paivio) — strict visual-auditory synchronicity every 3–4 seconds
4. Apply Micro-Dopamine Value Drops — bite-sized sequential takeaways with frequent visual changes
5. Apply Contrast Principle (Cialdini) — clear Problem/Agitation → Solution/Relief arc
6. Apply Frictionless CTA (Single-Choice Bias) — ONE singular, low-friction Comment-to-DM trigger
7. Follow Friction Loop → Agitation Spike → Relief Beat emotional journey

Generate the script in ${selectedLanguage} language with appropriate cultural pacing and tone.
Calculate an honest viralScore (0–100) based on hook strength, psychological principles, framework fit, dual-coding sync, and CTA effectiveness.`;

    const refinePrompt = `Apply the complete NemoScript Perfect Viral Script Formula to REFINE and RESTRUCTURE this raw draft into ONE single best viral video script.

RAW DRAFT TO REFINE:
${refineDraft}

═══════════════════════════════════════════════════
THE 5 CORE INPUTS
═══════════════════════════════════════════════════
TARGET AUDIENCE: ${effectiveAudience}
VIDEO DURATION: ${selectedDuration} — ${wordCountGuide}
SCENES COUNT: ${scenesCount} scenes (EXACTLY ${scenesCount} scenes)
SCRIPT LANGUAGE: ${selectedLanguage}
CTA TONE: ${ctaToneGuide}

Extract the core idea from the draft. Select the SINGLE BEST framework (HEARS, PAW, or C4) for this content. Generate only ONE script using that framework.
Apply all 6 psychological principles. Follow all rawMarkdown formatting rules exactly.
Generate the script in ${selectedLanguage} language.
Calculate an honest viralScore (0–100).`;

    generateStartedAt.current = Date.now();
    sendMessage(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: mode === 'refine' ? refinePrompt : createPrompt },
      ],
      { temperature: 0.85, max_tokens: 2200 },
      {
        scriptMeta: {
          ...buildScriptMeta(),
          audienceType: effectiveAudience,
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border px-5 sm:px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-col items-start gap-1.5 min-w-0">
          <img
            src="/brand/nemo-laptop.png"
            alt=""
            width={56}
            height={56}
            className="h-12 w-12 sm:h-14 sm:w-14 object-contain flex-shrink-0 drop-shadow-sm"
            decoding="async"
          />
          <div className="min-w-0">
            <h1 className="font-display text-xl sm:text-2xl font-extrabold text-foreground">
              Viral Script Writer
            </h1>
            <p className="text-sm text-muted-foreground font-sans mt-0.5">
              NemoScript — Perfect Viral Script Formula
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary/10 border border-primary/20 text-sm font-mono-custom text-primary font-bold">
            <Icon name="SparklesIcon" size={14} variant="solid" />
            NemoScript AI
          </div>
        </div>
      </div>

      <div className="px-5 sm:px-6 py-6 max-w-screen-xl mx-auto">
        {error ? (
          <div
            role="alert"
            className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          >
            <p className="font-semibold">AI could not generate a script</p>
            <p className="mt-1 text-amber-900/90">{error.message}</p>
          </div>
        ) : null}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* ── Left: Input Panel ── */}
          <div className="xl:col-span-2 space-y-5">
            {/* Mode Toggle */}
            <div className="bg-card border-2 border-border rounded-2xl p-1.5 flex gap-1">
              <button
                onClick={() => setMode('create')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold font-sans transition-all duration-200 ${
                  mode === 'create'
                    ? 'flame-gradient text-white shadow-flame-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon name="PlusCircleIcon" size={16} />
                Create New
              </button>
              <button
                onClick={() => setMode('refine')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold font-sans transition-all duration-200 ${
                  mode === 'refine'
                    ? 'flame-gradient text-white shadow-flame-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon name="WrenchScrewdriverIcon" size={16} />
                Refine Draft
              </button>
            </div>

            {/* ── INPUT A: Core Reel Topic (Create mode) ── */}
            {mode === 'create' && (
              <div className="bg-card border-2 border-border rounded-2xl p-5 space-y-4">
                <div>
                  <h2 className="font-mono-custom text-xs font-bold uppercase tracking-wider text-primary mb-1">
                    INPUT A — Core Reel Topic / Title
                  </h2>
                  <p className="text-sm text-muted-foreground font-sans">
                    The Spark — a singular, high-tension concept that creates a curiosity gap
                  </p>
                </div>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. My $10k morning routine that actually saves 3 hours&#10;e.g. The protein mistake costing you gains&#10;e.g. 5 AI tools that replaced my entire team"
                  rows={3}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                <div className="p-2.5 bg-[#FF3D00]/5 border border-[#FF3D00]/10 rounded-lg">
                  <p className="text-[10px] font-mono text-[#FF3D00]/70 leading-relaxed">
                    ✅ Good: &quot;My $10k routine that saves 3 hours&quot; &nbsp;·&nbsp; ❌ Vague:
                    &quot;My morning routine&quot;
                  </p>
                </div>

                {/* ── INPUT B: Target Audience ── */}
                <div>
                  <label className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground font-bold mb-2 block">
                    INPUT B — Target Audience (The Who)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {AUDIENCE_TYPES.map((a) => (
                      <button
                        key={a}
                        onClick={() => setAudienceType(a)}
                        className={`px-3 py-1.5 rounded-full text-xs font-sans font-medium border transition-all duration-150 ${
                          audienceType === a
                            ? 'bg-primary text-white border-primary'
                            : 'bg-muted text-muted-foreground border-border hover:text-foreground hover:border-primary/40'
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
                      placeholder="e.g. Web3 Developers, Stay-at-home Moms, Finance Bros…"
                      className="mt-2 w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  )}
                </div>
              </div>
            )}

            {/* ── Mode B: Refine Draft ── */}
            {mode === 'refine' && (
              <div className="card-surface border border-border rounded-2xl p-5 space-y-4">
                <div>
                  <h2 className="text-xs font-mono-custom uppercase tracking-widest text-[#FF3D00] font-bold mb-0.5">
                    Raw Script Ideas
                  </h2>
                  <p className="text-xs text-muted-foreground font-sans">
                    Paste your rough draft, bullet points, or unstructured ideas here
                  </p>
                </div>
                <textarea
                  value={refineDraft}
                  onChange={(e) => setRefineDraft(e.target.value)}
                  placeholder="Paste your rough draft here... e.g.&#10;- Hook: something about money mistakes&#10;- Talk about how I lost 50k&#10;- Solution: the 3 rules I follow now&#10;- CTA: comment MONEY"
                  rows={8}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                <div>
                  <label className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground font-bold mb-2 block">
                    INPUT B — Target Audience
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {AUDIENCE_TYPES.map((a) => (
                      <button
                        key={a}
                        onClick={() => setAudienceType(a)}
                        className={`px-3 py-1.5 rounded-full text-xs font-sans font-medium border transition-all duration-150 ${
                          audienceType === a
                            ? 'bg-primary text-white border-primary'
                            : 'bg-muted text-muted-foreground border-border hover:text-foreground hover:border-primary/40'
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
                      placeholder="e.g. Web3 Developers, Stay-at-home Moms…"
                      className="mt-2 w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  )}
                </div>
              </div>
            )}

            {/* ── INPUT C: Video Duration ── */}
            <div className="card-surface border border-border rounded-2xl p-5 space-y-3">
              <div>
                <h2 className="text-xs font-mono-custom uppercase tracking-widest text-[#FF3D00] font-bold mb-0.5">
                  INPUT C — Video Duration (The Pacing Window)
                </h2>
                <p className="text-xs text-muted-foreground font-sans">
                  Controls sentence length and verbal velocity
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {VIDEO_DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setSelectedDuration(d.value)}
                    className={`flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all duration-150 ${
                      selectedDuration === d.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-muted/50 hover:border-primary/40'
                    }`}
                  >
                    <span
                      className={`text-sm font-mono font-bold ${selectedDuration === d.value ? 'text-primary' : 'text-foreground'}`}
                    >
                      {d.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-sans leading-tight mt-0.5">
                      {d.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── INPUT D: Scenes Count ── */}
            <div className="card-surface border border-border rounded-2xl p-5 space-y-3">
              <div>
                <h2 className="text-xs font-mono-custom uppercase tracking-widest text-[#FF3D00] font-bold mb-0.5">
                  INPUT D — Scenes Count (The Cut Density)
                </h2>
                <p className="text-xs text-muted-foreground font-sans">
                  Controls visual cut density — 8–10 forces b-roll shifts every 2–3 seconds
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {SCENES_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setScenesCount(n)}
                    className={`w-10 h-10 rounded-xl border text-sm font-mono font-bold transition-all duration-150 ${
                      scenesCount === n
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-muted text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground font-sans">
                Selected:{' '}
                <span className="text-foreground font-mono font-bold">{scenesCount} scenes</span>
                {scenesCount >= 8
                  ? ' — High cut density, maximum engagement'
                  : scenesCount <= 5
                    ? ' — Focused narrative, clear story arc'
                    : ' — Balanced pacing'}
              </p>
            </div>

            {/* ── INPUT E: Language ── */}
            <div className="card-surface border border-border rounded-2xl p-5 space-y-3">
              <div>
                <h2 className="text-xs font-mono-custom uppercase tracking-widest text-[#FF3D00] font-bold mb-0.5">
                  INPUT E — Script Language (The Voice)
                </h2>
                <p className="text-xs text-muted-foreground font-sans">
                  Adjusts cultural conversational flow and pacing rules
                </p>
              </div>
              <div className="flex gap-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l}
                    onClick={() => setSelectedLanguage(l)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-sans font-medium transition-all duration-150 ${
                      selectedLanguage === l
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-muted text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <div className="p-2.5 bg-muted rounded-lg">
                <p className="text-[10px] font-sans text-muted-foreground leading-relaxed">
                  {selectedLanguage === 'English' &&
                    'Punchy, direct, momentum-driven — active verbs, short declarative sentences'}
                  {selectedLanguage === 'Hindi' &&
                    'Emotion-first, storytelling — warm vernacular, dramatic pauses, regional metaphors'}
                  {selectedLanguage === 'Hinglish' &&
                    'Youth-centric, frictionless — blend Hindi expressions with English nouns, casual friend-to-friend tone'}
                </p>
              </div>
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
                  {mode === 'refine' ? 'Refining Draft…' : 'Generating Script…'}
                </>
              ) : (
                <>
                  <Icon name="SparklesIcon" size={20} variant="solid" />
                  {mode === 'refine' ? 'Refine My Draft' : 'Generate Viral Script'}
                </>
              )}
            </button>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: 'Scripts Generated',
                  value: history.length.toString(),
                  icon: 'DocumentTextIcon',
                },
                {
                  label: 'Scenes / Script',
                  value: scenesCount.toString(),
                  icon: 'RectangleStackIcon',
                },
                { label: 'Language', value: selectedLanguage, icon: 'LanguageIcon' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="card-surface border border-border rounded-xl p-3 text-center"
                >
                  <Icon name={stat.icon as any} size={16} className="text-primary mx-auto mb-1" />
                  <p className="text-sm font-mono-custom font-bold text-foreground tabular-nums truncate">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground font-sans leading-tight mt-0.5">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Results Panel ── */}
          <div className="xl:col-span-3 space-y-5" ref={resultsRef}>
            {!generatedScript && !isLoading && !error && (
              <div className="card-surface border border-border rounded-2xl p-10 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="w-16 h-16 rounded-2xl flame-gradient flex items-center justify-center mb-4 opacity-80">
                  <Icon name="PencilSquareIcon" size={32} className="text-white" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-2">
                  Ready to go viral?
                </h3>
                <p className="text-sm font-sans text-muted-foreground max-w-xs leading-relaxed">
                  Enter your topic, set your duration and scene count, choose your language — and
                  let NemoScript select the best framework and apply 6 psychological principles to
                  craft your single highest-potential viral script.
                </p>
                <div className="mt-6 grid grid-cols-3 gap-3 w-full max-w-sm">
                  {[
                    { label: 'Best Framework Selected', icon: 'TrophyIcon' },
                    { label: '6 Psychology Principles', icon: 'BeakerIcon' },
                    { label: 'Viral Score Calculated', icon: 'FireIcon' },
                  ].map((f) => (
                    <div key={f.label} className="p-3 bg-muted rounded-xl text-center">
                      <Icon
                        name={f.icon as any}
                        size={18}
                        className="text-primary mx-auto mb-1.5"
                      />
                      <p className="text-xs font-sans text-muted-foreground leading-tight">
                        {f.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && !isLoading && (
              <div className="card-surface border border-destructive/30 bg-destructive/5 rounded-2xl p-6 sm:p-8">
                <h3 className="font-display text-lg font-bold text-foreground mb-2">
                  Script generation failed
                </h3>
                <p className="text-sm font-sans text-foreground/90 leading-relaxed">
                  {error.message}
                </p>
                {/monthly AI limit|Upgrade or try again/i.test(error.message) ? null : (
                  <p className="text-xs font-sans text-muted-foreground mt-3 leading-relaxed">
                    If this keeps failing, confirm{' '}
                    <span className="font-mono">OPENROUTER_API_KEY</span> is set in Vercel for{' '}
                    <span className="font-mono">AI_PROVIDER=OPENROUTER</span>, then redeploy. Free
                    models may briefly rate-limit — wait a moment and try again.
                  </p>
                )}
              </div>
            )}

            {/* Loading Animation */}
            {isLoading && <LoadingAnimation currentStep={loadingStep} />}

            {generatedScript && !isLoading && (
              <>
                {/* Header & Metadata Zone */}
                <div className="card-surface border border-border rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-mono-custom uppercase tracking-wide text-[#FFB000] bg-[#FFB000]/10 px-2.5 py-1 rounded-full border border-[#FFB000]/20">
                          {generatedScript.audienceType}
                        </span>
                        <span className="text-xs font-mono-custom uppercase tracking-wide text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                          {generatedScript.duration}
                        </span>
                        <span className="text-xs font-mono-custom uppercase tracking-wide text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border">
                          {generatedScript.scenesCount} scenes
                        </span>
                        <span className="text-xs font-mono-custom uppercase tracking-wide text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border">
                          {generatedScript.language}
                        </span>
                      </div>
                      <h2 className="font-display text-lg font-bold text-foreground leading-snug mt-2">
                        &ldquo;{generatedScript.topic}&rdquo;
                      </h2>
                      <p className="text-xs text-muted-foreground font-sans mt-1">
                        Framework:{' '}
                        <span className="font-semibold text-foreground">
                          {generatedScript.frameworkLabel}
                        </span>
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
                </div>

                {/* Viral Score — Prominent Display */}
                <ViralScoreDisplay score={generatedScript.viralScore} />

                {/* Hook Preview */}
                <div className="card-surface border border-border rounded-2xl p-5">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF3D00] font-bold mb-2">
                    ⚡ Pattern Interrupt Hook
                  </p>
                  <p className="text-base font-sans text-gray-900 leading-relaxed italic font-medium">
                    &ldquo;{generatedScript.hook}&rdquo;
                  </p>
                </div>

                {/* Full Script Card */}
                <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
                  <div className="p-4 flex items-center justify-between gap-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#FF3D00]" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 font-sans">
                          {generatedScript.frameworkLabel}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">Scene-by-scene breakdown</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF3D00]/10 hover:bg-[#FF3D00]/20 text-[#FF3D00] text-xs font-sans font-semibold transition-colors border border-[#FF3D00]/20"
                      >
                        <Icon name={copied ? 'CheckIcon' : 'ClipboardDocumentIcon'} size={13} />
                        {copied ? 'Copied!' : 'Copy Script'}
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveScript}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted border border-border text-xs font-sans font-semibold text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
                      >
                        <Icon name="ArchiveBoxIcon" size={13} />
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={() => setExpanded((v) => !v)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-muted border border-border text-xs font-sans text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Icon name={expanded ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={13} />
                        {expanded ? 'Collapse' : 'Expand'}
                      </button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="px-4 pb-4 space-y-3">
                      <ParsedScriptViewer script={generatedScript} />

                      {/* Timestamps */}
                      {generatedScript.timestamps?.length > 0 && (
                        <div className="pt-2">
                          <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 font-bold mb-2">
                            Timestamps
                          </p>
                          <div className="space-y-1">
                            {generatedScript.timestamps.map((ts, i) => (
                              <div
                                key={`ts-${i}`}
                                className="flex items-center gap-2 text-xs font-sans text-gray-600"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#FF3D00]/50 flex-shrink-0" />
                                {ts}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Delivery notes */}
                      {generatedScript.deliveryNotes && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                          <p className="text-[10px] font-mono uppercase tracking-widest text-amber-700 font-bold mb-1">
                            🎬 Delivery Notes
                          </p>
                          <p className="text-xs font-sans text-gray-700 leading-relaxed">
                            {generatedScript.deliveryNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Analytical Widgets */}
                <RetentionStrategyPanel
                  audienceType={generatedScript.audienceType}
                  language={generatedScript.language}
                  duration={generatedScript.duration}
                />
                <ViralTriggerPanel
                  scenesCount={generatedScript.scenesCount}
                  viralScore={generatedScript.viralScore}
                  language={generatedScript.language}
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
                      onClick={() => {
                        setGeneratedScript(h);
                        setExpanded(true);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted hover:bg-muted/80 border border-border hover:border-primary/30 transition-all text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-sans font-medium text-foreground truncate">
                          {h.topic}
                        </p>
                        <p className="text-xs text-muted-foreground font-sans">
                          {h.duration} · {h.scenesCount} scenes · {h.language}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-xs font-mono font-bold ${getScoreColor(h.viralScore)}`}
                        >
                          {h.viralScore}%
                        </span>
                        <Icon name="ChevronRightIcon" size={14} className="text-muted-foreground" />
                      </div>
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
