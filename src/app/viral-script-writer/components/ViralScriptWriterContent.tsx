'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@/lib/hooks/useChat';
import toast from 'react-hot-toast';
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
  rawMarkdown?: string;
}

interface GeneratedScript {
  topic: string;
  audienceType: string;
  duration: string;
  scenesCount: number;
  language: string;
  versions: ScriptVersion[];
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
  'Structuring HEARS · PAW · C4 frameworks…',
  'Calibrating Dual-Coding visual-auditory sync…',
  'Engineering Friction → Agitation → Relief arc…',
  'Finalising scene-by-scene breakdown & CTA…',
];

// ─── Master System Prompt (NemoScript Perfect Viral Script Formula) ───────────

const SYSTEM_PROMPT = `You are NemoScript — an advanced viral video script engineering engine built on a decade of behavioral science, digital psychology, cognitive load theory, and conversion copywriting. Your sole purpose is to craft micro-narratives optimized for social media recommendation algorithms (Instagram Reels, TikTok, YouTube Shorts) that maximize video completion rates, saves, and repeat views.

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
SECTION 2 — THREE STRUCTURAL FRAMEWORKS (ONE PER VERSION)
═══════════════════════════════════════════════════════════════════

VERSION 1 — HEARS FRAMEWORK (Relatable & Informative Content)
H – Hook:      Stop the scroll instantly with a high-impact pattern interrupt.
E – Empathy:   Establish immediate peer-to-peer connection. Validate the audience's current struggle.
               Example: "I know exactly how exhausting it is to stare at a blank draft…"
A – Authority: Prove credibility quickly but humbly. Establish why the viewer should trust your solution.
R – Reason:    Detail the logical core of why the old way fails; introduce high-value educational insights.
S – Solution:  Reveal the frictionless system to achieve the goal, driving direct engagement.

VERSION 2 — PAW FRAMEWORK (Motivational & Direct Pain-Point Content)
P – Problem:   State a painful friction point or relatable struggle directly.
A – Agitate:   Rub salt in the wound. Explain the compounding negative consequences of NOT addressing this problem — creating psychological urgency.
W – Win:       Introduce the product, lifestyle shift, or workaround as the ultimate victory, providing immediate satisfaction.

VERSION 3 — C4 FRAMEWORK (Conversion & Fast-Paced Product Demos)
C1 – Captivate: Establish high visual and verbal velocity in the first 3 seconds.
C2 – Connect:   Build a bridge between the viewer's current state and their desired future self.
C3 – Convince:  Deliver undeniable proof points, high-value visual b-roll examples, and bulletproof metrics.
C4 – Convert:   Introduce a frictionless, singular call to action.

═══════════════════════════════════════════════════════════════════
SECTION 3 — SIX PSYCHOLOGICAL PRINCIPLES (APPLY ALL IN EVERY SCRIPT)
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
Viewers processing mobile videos have limited working memory. Dual-coding uses both visual and verbal channels simultaneously to reduce cognitive friction.

RULE 1 — VISUAL-AUDITORY SYNCHRONICITY: Audio and visual channels must reinforce each other. When audio mentions "your phone," the visual cue must immediately instruct the creator to hold up a phone or zoom onto a screen.
RULE 2 — THE 3-SECOND CUT RULE: Visual scene changes must occur every 3–4 seconds. Distribute visual cues evenly across scenes.

═══════════════════════════════════════════════════════════════════
SECTION 5 — EMOTIONAL JOURNEY STRUCTURE
═══════════════════════════════════════════════════════════════════
Every script MUST follow: FRICTION LOOP → AGITATION SPIKE → RELIEF BEAT

• FRICTION LOOP: Start with a high-tension problem to keep the heart rate up (capturing early-retention metrics).
• AGITATION SPIKE: Increase tension by highlighting what happens if the viewer continues failing (driving up emotional investment).
• RELIEF BEAT: Reveal the solution/tool. Shift visual direction to a calmer, more structured setting; shift tone to confident and reassuring. This contrast creates a rewarding neurological dopamine release, making the viewer far more likely to SAVE the video or click the CTA.

═══════════════════════════════════════════════════════════════════
SECTION 6 — LANGUAGE-SPECIFIC PACING RULES
═══════════════════════════════════════════════════════════════════

ENGLISH — Punchy, Direct, Momentum-Driven:
1. Use active, high-velocity verbs.
2. Keep sentence structures short and declarative.
3. Eliminate unnecessary transitions ("However," "Furthermore" — banned).

HINDI — Emotion-First, Relatable, Storytelling:
1. Connect through highly expressive regional hooks and metaphors.
2. Use warm, conversational, friendly vernacular that sounds natural for text-to-speech engine inflection.
3. Emphasize visual storytelling cues to keep Hindi audiences hooked through dramatic, high-retention pauses.

HINGLISH — Youth-Centric, Tech-Savvy, Frictionless:
1. Blend native Hindi expressions with modern English nouns (dominant language format for urban youth in South Asia).
2. Use for modern educational, technical, or finance scripts.
3. Pair tech-slang with highly colloquial, casual phrasing — target tone: "a voice note sent from a friend."

═══════════════════════════════════════════════════════════════════
SECTION 7 — CTA FORMULA ENGINE
═══════════════════════════════════════════════════════════════════
Core CTA Design Principle: Never use compound CTAs. Always enforce one action, one word, one outcome.

FORMULA 1 — Single Action Bias: One low-friction command only.
Example: "Comment NEMO down below"

FORMULA 2 — Comment-to-DM Trigger: Tell viewers to type a specific keyword → auto-DM details.
Example: "Comment SECRETS and I'll send you the exact beta link directly to your DMs"

FORMULA 3 — Value-Led CTA: Always pair the conversion action with immediate, undeniable value.
Example: "Comment NEMO and I will send you the secret beta access link right now!"

The comment keyword method simultaneously maximizes algorithm ranking signals AND opens a private conversion funnel.

═══════════════════════════════════════════════════════════════════
SECTION 8 — DURATION-SPECIFIC PACING CALIBRATION
═══════════════════════════════════════════════════════════════════
15s: Hyper-dense single clauses only. Maximum 1–2 words per visual cue. One-sentence audio lines. Hook + single value drop + CTA.
30s: Punchy 2-beat structure. Hook + agitation + solution + CTA. Each audio line max 15 words.
1m: Full HEARS or PAW arc. 5–7 scenes. Each audio line 15–25 words. Allow one metaphor or analogy.
2m: Deep multi-step value breakdown. 8–10 scenes. Full emotional journey. Multiple proof points. Allow storytelling.

═══════════════════════════════════════════════════════════════════
SECTION 9 — OUTPUT FORMAT (RESPOND WITH VALID JSON ONLY)
═══════════════════════════════════════════════════════════════════
{
  "versions": [
    {
      "id": "v1",
      "style": "hears",
      "styleLabel": "HEARS — Relatable & Informative",
      "hook": "Pattern interrupt opening line (the exact first spoken sentence)",
      "viralScore": 88,
      "timestamps": ["0:00 - Pattern interrupt hook", "0:03 - Empathy validation", "0:08 - Authority proof"],
      "deliveryNotes": "Specific visual-auditory sync instructions and recording guidance",
      "rawMarkdown": "# Scene 1: The Scroll-Stopper Hook\\n[Visual Cue]: Fast zoom-in on host looking frustrated, big text overlay: STOP WAITING.\\n[Audio Script]: Most creators think they need 10 hours to make one video. That's a flat out lie.\\n\\n# Scene 2: The Agitation Trap\\n[Visual Cue]: Close-up of camera lens. Text transition: NemoScript does it in 5 seconds.\\n[Audio Script]: Look at this. You paste one word, choose your scene count, and you get a dual-direction map.\\n\\n# Scene 3: The System Reveal\\n[Visual Cue]: Over-the-shoulder view of host smiling, typing on laptop.\\n[Audio Script]: It divides camera b-roll cues from actual voiceovers so you never get stuck during editing.\\n\\n# Scene 4: The Strategic Benefit\\n[Visual Cue]: Quick cut showing a high-contrast screen. Accent lighting in background.\\n[Audio Script]: No more staring at a blank Google Doc wondering what to shoot.\\n\\n# Scene 5: High-Impact Call to Action\\n[Visual Cue]: Split screen of the creator pointing down to the comments.\\nCTA: Comment NEMO and I will send you the secret beta access link right now!"
    },
    {
      "id": "v2",
      "style": "paw",
      "styleLabel": "PAW — Motivational & Pain-Point",
      "hook": "...",
      "viralScore": 84,
      "timestamps": ["..."],
      "deliveryNotes": "...",
      "rawMarkdown": "# Scene 1: ...\\n[Visual Cue]: ...\\n[Audio Script]: ...\\n\\n# Scene 2: ...\\n[Visual Cue]: ...\\n[Audio Script]: ...\\n\\nCTA: ..."
    },
    {
      "id": "v3",
      "style": "c4",
      "styleLabel": "C4 — Captivate, Connect, Convince, Convert",
      "hook": "...",
      "viralScore": 81,
      "timestamps": ["..."],
      "deliveryNotes": "...",
      "rawMarkdown": "# Scene 1: ...\\n[Visual Cue]: ...\\n[Audio Script]: ...\\n\\nCTA: ..."
    }
  ]
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

// ─── Script Card ─────────────────────────────────────────────────────────────

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
      {/* Header & Metadata Zone */}
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
          {/* Audio-Visual Alternation Zone */}
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

function RetentionStrategyPanel({ audienceType, language, duration }: { audienceType: string; language: string; duration: string }) {
  const hookStrategy: Record<string, string> = {
    Relatable: 'addresses a direct pain point using Loss Aversion (Kahneman & Tversky) — people are 2× more motivated to avoid loss than to pursue gain. Start with a high-impact pattern interrupt that mirrors the viewer\'s daily frustration.',
    Informative: 'deploys Information Gap Theory (George Loewenstein, 1994) for Informative audiences. Open with a surprising fact or counterintuitive claim that creates a knowledge gap the viewer must resolve by watching to completion.',
    Science: 'leverages cognitive dissonance for Science audiences. Lead with a data-backed contradiction that forces the brain to seek resolution — triggering the Curiosity Gap mechanism.',
    Motivational: 'triggers emotional urgency using the Friction → Agitation → Relief arc for Motivational audiences. Begin with a high-stakes consequence (Agitation Spike) that creates immediate psychological tension before delivering the Relief Beat.',
    Other: 'uses a curiosity gap tailored to your niche. Open mid-sentence with an unresolved statement that demands the viewer keep watching — activating the Information Gap Theory loop.',
  };

  const langPacing: Record<string, string> = {
    English: 'High-velocity pacing — punchy declarative sentences, active high-velocity verbs, no filler words ("However," "Furthermore" banned), momentum-driven delivery calibrated to ~130–150 words per minute.',
    Hindi: 'Emotion-first delivery — highly expressive regional hooks and metaphors, warm conversational vernacular, dramatic high-retention pauses for maximum emotional resonance.',
    Hinglish: 'Youth-centric, frictionless tone — blend native Hindi expressions with modern English nouns, casual friend-to-friend delivery. Target tone: "a voice note sent from a friend."',
  };

  const durationPacing: Record<string, string> = {
    '15s': 'Hyper-dense single clauses. Hook + single value drop + CTA only. Maximum 1–2 words per visual cue.',
    '30s': 'Punchy 2-beat structure. Hook + agitation + solution + CTA. Each audio line max 15 words.',
    '1m': 'Full HEARS or PAW arc. 5–7 scenes. Each audio line 15–25 words. One metaphor or analogy allowed.',
    '2m': 'Deep multi-step value breakdown. 8–10 scenes. Full emotional journey with multiple proof points and storytelling.',
  };

  const strategy = hookStrategy[audienceType] || hookStrategy['Relatable'];
  const pacing = langPacing[language] || 'Adapt pacing to regional content consumption patterns and cultural nuance.';
  const durationNote = durationPacing[duration] || '';

  return (
    <div className="rounded-2xl border border-[#6B534E]/30 bg-[#1A1210]/60 overflow-hidden">
      <div className="px-4 py-3 border-b border-[#6B534E]/20 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[#FFB000]/10 border border-[#FFB000]/20 flex items-center justify-center flex-shrink-0">
          <Icon name="ChartBarIcon" size={14} className="text-[#FFB000]" />
        </div>
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-[#FFB000] font-bold">Retention Strategy Panel</p>
          <p className="text-[10px] text-[#6B534E] font-sans">Hook delivery psychology · 6-principle framework</p>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="p-3 bg-[#FFB000]/5 border border-[#FFB000]/10 rounded-xl">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#FFB000] font-bold mb-1.5">Hook Psychology — {audienceType} Audience</p>
          <p className="text-sm font-sans text-[#F7EFE7]/80 leading-relaxed">
            The hook {strategy}
          </p>
        </div>
        <div className="p-3 bg-[#6B534E]/10 border border-[#6B534E]/20 rounded-xl">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#6B534E] font-bold mb-1.5">Language Pacing — {language}</p>
          <p className="text-sm font-sans text-[#F7EFE7]/70 leading-relaxed">{pacing}</p>
        </div>
        {durationNote && (
          <div className="p-3 bg-[#FF3D00]/5 border border-[#FF3D00]/10 rounded-xl">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF3D00] font-bold mb-1.5">Duration Calibration — {duration}</p>
            <p className="text-sm font-sans text-[#F7EFE7]/70 leading-relaxed">{durationNote}</p>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs font-sans text-[#6B534E]">
          <Icon name="InformationCircleIcon" size={13} />
          <span>Friction Loop → Agitation Spike → Relief Beat emotional arc applied</span>
        </div>
      </div>
    </div>
  );
}

// ─── Viral Trigger Panel ──────────────────────────────────────────────────────

function ViralTriggerPanel({ scenesCount, viralScore, language }: { scenesCount: number; viralScore: number; language: string }) {
  const triggers = [
    {
      label: 'Information Gap Theory',
      desc: 'Opening hook creates an unresolved knowledge gap (Loewenstein 1994) that compels viewers to watch to completion to resolve the psychological "itch."',
      icon: 'MagnifyingGlassIcon',
      color: 'text-purple-400',
    },
    {
      label: 'Comment-to-DM CTA',
      desc: 'Single-action CTA drives comment velocity — the highest-weighted algorithmic signal on short-form platforms — while opening a private conversion funnel.',
      icon: 'ChatBubbleLeftRightIcon',
      color: 'text-blue-400',
    },
    {
      label: 'Dual-Coding Sync (Paivio)',
      desc: `Visual and audio cues are synchronized every 3–4 seconds across all ${scenesCount} scenes to reduce cognitive load and maximize retention rate.`,
      icon: 'FilmIcon',
      color: 'text-green-400',
    },
    {
      label: 'Loss Aversion Hook',
      desc: 'Hook framed around avoiding mistakes (Kahneman & Tversky) — people are 2× more motivated to avoid loss than to pursue gain.',
      icon: 'ExclamationTriangleIcon',
      color: 'text-yellow-400',
    },
  ];

  const recordingTips: Record<string, string> = {
    English: 'Record in 9:16 vertical. Use a lavalier mic for crisp audio. Shoot in natural light or a ring light setup. Add bold text overlays in the first frame.',
    Hindi: 'Record in 9:16 vertical. Use a directional mic for warm audio. Dramatic pauses are your retention tool — let silence work. Add Hindi text overlays.',
    Hinglish: 'Record in 9:16 vertical. Casual, handheld feel works best. Mix Hindi and English text overlays. Keep energy high and conversational throughout.',
  };

  const tip = recordingTips[language] || recordingTips['English'];

  return (
    <div className="rounded-2xl border border-[#6B534E]/30 bg-[#1A1210]/60 overflow-hidden">
      <div className="px-4 py-3 border-b border-[#6B534E]/20 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[#FF3D00]/10 border border-[#FF3D00]/20 flex items-center justify-center flex-shrink-0">
          <Icon name="RocketLaunchIcon" size={14} className="text-[#FF3D00]" />
        </div>
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-[#FF3D00] font-bold">Viral Trigger Panel</p>
          <p className="text-[10px] text-[#6B534E] font-sans">Engagement techniques applied · {scenesCount} scenes</p>
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
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF3D00] font-bold mb-1">📹 Recording Tip — {language}</p>
          <p className="text-xs font-sans text-[#F7EFE7]/70 leading-relaxed">{tip}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Loading Animation ────────────────────────────────────────────────────────

function LoadingAnimation({ currentStep }: { currentStep: number }) {
  return (
    <div className="card-surface border border-border rounded-2xl p-10 flex flex-col items-center justify-center text-center min-h-[500px]">
      {/* Layered ping ring + pulsing fire icon */}
      <div className="relative mb-8 flex items-center justify-center">
        <span className="absolute w-24 h-24 rounded-full border-2 border-[#FF3D00]/30 animate-ping" />
        <span className="absolute w-16 h-16 rounded-full border border-[#FF3D00]/20 animate-pulse" />
        <div className="relative z-10 w-14 h-14 rounded-2xl flame-gradient flex items-center justify-center shadow-lg">
          <Icon name="FireIcon" size={28} className="text-white" variant="solid" />
        </div>
      </div>

      <h3 className="font-display text-xl font-bold text-[#F7EFE7] mb-1">Engineering your viral script…</h3>
      <p className="text-sm font-sans text-[#6B534E] max-w-xs leading-relaxed mb-8">
        Parsing visual synchronicity and informational gap theory loops — applying 6-principle psychology framework.
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

  // ── The 5 Core Inputs (PERFECT_SCRIPT_FORMULA) ──
  const [topic, setTopic] = useState('');
  const [audienceType, setAudienceType] = useState<string>('Relatable');
  const [customAudience, setCustomAudience] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<string>('30s');
  const [scenesCount, setScenesCount] = useState<number>(5);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');

  // ── Refine Draft ──
  const [refineDraft, setRefineDraft] = useState('');

  // ── Output State ──
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string>('v1');
  const [history, setHistory] = useState<GeneratedScript[]>([]);
  const [loadingStep, setLoadingStep] = useState(0);

  const resultsRef = useRef<HTMLDivElement>(null);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { response, isLoading, error, sendMessage } = useChat('GEMINI', 'gemini/gemini-2.5-pro', false);

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
        const newScript: GeneratedScript = {
          topic: mode === 'refine' ? 'Refined Draft' : topic,
          audienceType,
          duration: selectedDuration,
          scenesCount,
          language: selectedLanguage,
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
      toast.error('Please enter a reel topic first');
      return;
    }
    if (mode === 'refine' && !refineDraft.trim()) {
      toast.error('Please paste your draft first');
      return;
    }

    const effectiveAudience = audienceType === 'Other' && customAudience.trim() ? customAudience.trim() : audienceType;

    // Language-specific CTA tone guidance
    const ctaToneGuide =
      selectedLanguage === 'Hindi' ?'Use emotion-first, dramatic high-retention pauses, warm conversational vernacular for the CTA. Hindi text is preferred.'
        : selectedLanguage === 'Hinglish' ?'Use casual friend-to-friend tone, blend Hindi expressions with English nouns, frictionless and colloquial CTA. Mix Hindi and English naturally.' :'Use punchy, direct, momentum-driven CTA with active high-velocity verbs and short declarative sentences.';

    // Duration-specific word count guidance
    const wordCountGuide =
      selectedDuration === '15s' ? 'Maximum 30–40 total spoken words across all scenes. Hyper-dense single clauses only.'
      : selectedDuration === '30s' ? 'Maximum 70–90 total spoken words. Each audio line max 15 words.'
      : selectedDuration === '1m'? 'Maximum 140–160 total spoken words. Each audio line 15–25 words. One metaphor allowed.' :'Maximum 280–320 total spoken words. Full storytelling arc with multiple proof points.';

    const createPrompt = `Apply the complete NemoScript Perfect Viral Script Formula to generate 3 viral video script versions.

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
CRITICAL: Generate EXACTLY ${scenesCount} scenes per script version. Each scene must have [Visual Cue] + [Audio Script] alternating.

INPUT E — SCRIPT LANGUAGE (The Voice):
${selectedLanguage}
CTA Tone: ${ctaToneGuide}

═══════════════════════════════════════════════════
REQUIRED FRAMEWORK ASSIGNMENT
═══════════════════════════════════════════════════
Version 1 (v1): HEARS framework — Hook → Empathy → Authority → Reason → Solution
Version 2 (v2): PAW framework — Problem → Agitate → Win/Workaround
Version 3 (v3): C4 framework — Captivate → Connect → Convince → Convert

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

Generate all scripts in ${selectedLanguage} language with appropriate cultural pacing and tone.`;

    const refinePrompt = `Apply the complete NemoScript Perfect Viral Script Formula to REFINE and RESTRUCTURE this raw draft into 3 viral video script versions.

RAW DRAFT TO REFINE:
${refineDraft}

═══════════════════════════════════════════════════
THE 5 CORE INPUTS
═══════════════════════════════════════════════════
TARGET AUDIENCE: ${effectiveAudience}
VIDEO DURATION: ${selectedDuration} — ${wordCountGuide}
SCENES COUNT: ${scenesCount} scenes (EXACTLY ${scenesCount} scenes per version)
SCRIPT LANGUAGE: ${selectedLanguage}
CTA TONE: ${ctaToneGuide}

Extract the core idea from the draft and apply HEARS (v1), PAW (v2), and C4 (v3) frameworks.
Apply all 6 psychological principles. Follow all rawMarkdown formatting rules exactly.
Generate all scripts in ${selectedLanguage} language.`;

    sendMessage(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: mode === 'refine' ? refinePrompt : createPrompt },
      ],
      { temperature: 0.85, max_tokens: 5000 }
    );
  };

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
            <p className="text-xs text-muted-foreground font-sans">NemoScript — Perfect Viral Script Formula</p>
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

            {/* Mode Toggle */}
            <div className="card-surface border border-border rounded-2xl p-1.5 flex gap-1">
              <button
                onClick={() => setMode('create')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-sans font-semibold transition-all duration-200 ${
                  mode === 'create' ? 'flame-gradient text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon name="PlusCircleIcon" size={15} />
                Create New
              </button>
              <button
                onClick={() => setMode('refine')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-sans font-semibold transition-all duration-200 ${
                  mode === 'refine' ? 'flame-gradient text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon name="WrenchScrewdriverIcon" size={15} />
                Refine Draft
              </button>
            </div>

            {/* ── INPUT A: Core Reel Topic (Create mode) ── */}
            {mode === 'create' && (
              <div className="card-surface border border-border rounded-2xl p-5 space-y-4">
                <div>
                  <h2 className="text-xs font-mono-custom uppercase tracking-widest text-[#FF3D00] font-bold mb-0.5">INPUT A — Core Reel Topic / Title</h2>
                  <p className="text-xs text-muted-foreground font-sans">The Spark — a singular, high-tension concept that creates a curiosity gap</p>
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
                    ✅ Good: "My $10k routine that saves 3 hours" &nbsp;·&nbsp; ❌ Vague: "My morning routine"
                  </p>
                </div>

                {/* ── INPUT B: Target Audience ── */}
                <div>
                  <label className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground font-bold mb-2 block">INPUT B — Target Audience (The Who)</label>
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
                  <h2 className="text-xs font-mono-custom uppercase tracking-widest text-[#FF3D00] font-bold mb-0.5">Raw Script Ideas</h2>
                  <p className="text-xs text-muted-foreground font-sans">Paste your rough draft, bullet points, or unstructured ideas here</p>
                </div>
                <textarea
                  value={refineDraft}
                  onChange={(e) => setRefineDraft(e.target.value)}
                  placeholder="Paste your rough draft here... e.g.&#10;- Hook: something about money mistakes&#10;- Talk about how I lost 50k&#10;- Solution: the 3 rules I follow now&#10;- CTA: comment MONEY"
                  rows={8}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                {/* Audience for refine mode */}
                <div>
                  <label className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground font-bold mb-2 block">INPUT B — Target Audience</label>
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
                <h2 className="text-xs font-mono-custom uppercase tracking-widest text-[#FF3D00] font-bold mb-0.5">INPUT C — Video Duration (The Pacing Window)</h2>
                <p className="text-xs text-muted-foreground font-sans">Controls sentence length and verbal velocity</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {VIDEO_DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setSelectedDuration(d.value)}
                    className={`flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all duration-150 ${
                      selectedDuration === d.value
                        ? 'border-primary bg-primary/10' :'border-border bg-muted/50 hover:border-primary/40'
                    }`}
                  >
                    <span className={`text-sm font-mono font-bold ${selectedDuration === d.value ? 'text-primary' : 'text-foreground'}`}>{d.label}</span>
                    <span className="text-[10px] text-muted-foreground font-sans leading-tight mt-0.5">{d.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── INPUT D: Scenes Count ── */}
            <div className="card-surface border border-border rounded-2xl p-5 space-y-3">
              <div>
                <h2 className="text-xs font-mono-custom uppercase tracking-widest text-[#FF3D00] font-bold mb-0.5">INPUT D — Scenes Count (The Cut Density)</h2>
                <p className="text-xs text-muted-foreground font-sans">Controls visual cut density — 8–10 forces b-roll shifts every 2–3 seconds</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {SCENES_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setScenesCount(n)}
                    className={`w-10 h-10 rounded-xl border text-sm font-mono font-bold transition-all duration-150 ${
                      scenesCount === n
                        ? 'border-primary bg-primary/10 text-primary' :'border-border bg-muted text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground font-sans">
                Selected: <span className="text-foreground font-mono font-bold">{scenesCount} scenes</span>
                {scenesCount >= 8 ? ' — High cut density, maximum engagement' : scenesCount <= 5 ? ' — Focused narrative, clear story arc' : ' — Balanced pacing'}
              </p>
            </div>

            {/* ── INPUT E: Language ── */}
            <div className="card-surface border border-border rounded-2xl p-5 space-y-3">
              <div>
                <h2 className="text-xs font-mono-custom uppercase tracking-widest text-[#FF3D00] font-bold mb-0.5">INPUT E — Script Language (The Voice)</h2>
                <p className="text-xs text-muted-foreground font-sans">Adjusts cultural conversational flow and pacing rules</p>
              </div>
              <div className="flex gap-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l}
                    onClick={() => setSelectedLanguage(l)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-sans font-medium transition-all duration-150 ${
                      selectedLanguage === l
                        ? 'border-primary bg-primary/10 text-primary' :'border-border bg-muted text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <div className="p-2.5 bg-muted rounded-lg">
                <p className="text-[10px] font-sans text-muted-foreground leading-relaxed">
                  {selectedLanguage === 'English' && 'Punchy, direct, momentum-driven — active verbs, short declarative sentences'}
                  {selectedLanguage === 'Hindi' && 'Emotion-first, storytelling — warm vernacular, dramatic pauses, regional metaphors'}
                  {selectedLanguage === 'Hinglish' && 'Youth-centric, frictionless — blend Hindi expressions with English nouns, casual friend-to-friend tone'}
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
                { label: 'Scenes / Script', value: scenesCount.toString(), icon: 'RectangleStackIcon' },
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
                  Enter your topic, set your duration and scene count, choose your language — and let NemoScript apply the Perfect Viral Script Formula with 6 psychological principles to craft 3 scene-by-scene scripts.
                </p>
                <div className="mt-6 grid grid-cols-3 gap-3 w-full max-w-sm">
                  {[
                    { label: 'HEARS · PAW · C4', icon: 'DocumentDuplicateIcon' },
                    { label: '6 Psychology Principles', icon: 'BeakerIcon' },
                    { label: 'Scene-by-Scene Cards', icon: 'RectangleStackIcon' },
                  ].map((f) => (
                    <div key={f.label} className="p-3 bg-muted rounded-xl text-center">
                      <Icon name={f.icon as any} size={18} className="text-primary mx-auto mb-1.5" />
                      <p className="text-xs font-sans text-muted-foreground leading-tight">{f.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading Animation */}
            {isLoading && <LoadingAnimation currentStep={loadingStep} />}

            {generatedScript && !isLoading && (
              <>
                {/* Header & Metadata Zone */}
                <div className="card-surface border border-border rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
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
                        {generatedScript.versions.length} script versions · HEARS · PAW · C4 · Powered by Gemini AI
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

                {/* Audio-Visual Alternation Zone: Script versions */}
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

                {/* Analytical Widgets */}
                <RetentionStrategyPanel
                  audienceType={generatedScript.audienceType}
                  language={generatedScript.language}
                  duration={generatedScript.duration}
                />
                <ViralTriggerPanel
                  scenesCount={generatedScript.scenesCount}
                  viralScore={selectedVersionData?.viralScore ?? generatedScript.versions[0]?.viralScore ?? 80}
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
                      onClick={() => { setGeneratedScript(h); setSelectedVersion('v1'); }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted hover:bg-muted/80 border border-border hover:border-primary/30 transition-all text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-sans font-medium text-foreground truncate">{h.topic}</p>
                        <p className="text-xs text-muted-foreground font-sans">{h.duration} · {h.scenesCount} scenes · {h.language}</p>
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
