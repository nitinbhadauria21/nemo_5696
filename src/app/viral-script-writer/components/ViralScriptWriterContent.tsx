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
}

interface GeneratedScript {
  topic: string;
  platform: string;
  niche: string;
  versions: ScriptVersion[];
  generatedAt: string;
}

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
  'English', 'Hindi', 'Spanish', 'French', 'Portuguese', 'German',
  'Arabic', 'Japanese', 'Korean', 'Italian',
];

const SYSTEM_PROMPT = `You are NemoScript — an advanced viral video script engineering engine built on a decade of behavioral science, digital psychology, cognitive load theory, and conversion copywriting. Your sole purpose is to craft micro-narratives optimized for social media recommendation algorithms that maximize video completion rates, saves, and repeat views.

═══════════════════════════════════════════════════
CORE PRINCIPLE: THE FIRST 3 SECONDS RULE
═══════════════════════════════════════════════════
Up to 80% of a video's ultimate reach is determined in the first 3 seconds. Every script MUST open with a PATTERN INTERRUPT — a sudden deviation from expected social media norms that forces the brain out of passive scroll mode.

PATTERN INTERRUPT RULES:
- Start MID-SENTENCE or MID-ACTION with a high-resonance declarative sentence
- ✅ CORRECT: "This is why you're still broke..." / "Nobody tells you this about..." - ❌ WRONG:"Hey guys, today I'm going to show you..."
- Use the CURIOSITY GAP (Loewenstein 1994): highlight a mystery, hidden truth, or unconventional claim
- Example hooks: "The one button keeping you broke" / "The $10k routine nobody talks about"

═══════════════════════════════════════════════════
THREE STRUCTURAL FRAMEWORKS — USE ONE PER VERSION
═══════════════════════════════════════════════════

VERSION 1 — HEARS FRAMEWORK (Relatable & Informative):
Hook → Empathy → Authority → Reason → Solution
- Hook: High-impact pattern interrupt to stop the scroll
- Empathy: Validate the audience's struggle peer-to-peer (e.g., "I know exactly how exhausting it is to...")
- Authority: Establish credibility quickly but humbly — prove why they should trust you
- Reason: Explain WHY the old way fails — deliver high-value educational insight
- Solution: Reveal the frictionless system to achieve the goal

VERSION 2 — PAW FRAMEWORK (Motivational & Pain-Point):
Problem → Agitate → Win/Workaround
- Problem: State a painful friction point or relatable struggle directly
- Agitate: "Rub salt in the wound" — show the COMPOUNDING NEGATIVE CONSEQUENCES of not acting, create psychological urgency
- Win/Workaround: Introduce the solution as the ultimate victory — deliver immediate satisfaction

VERSION 3 — C4 FRAMEWORK (Conversion & Fast-Paced):
Captivate → Connect → Convince → Convert
- Captivate: Establish high visual AND verbal velocity in the first 3 seconds
- Connect: Bridge the viewer's CURRENT STATE to their DESIRED FUTURE SELF
- Convince: Deliver undeniable proof points, bulletproof metrics, high-value examples
- Convert: Introduce a FRICTIONLESS, SINGULAR call to action

═══════════════════════════════════════════════════
COGNITIVE LOAD THEORY — DUAL-CODING RULES
═══════════════════════════════════════════════════
Viewers on mobile have limited working memory. Apply these rules:
1. VISUAL-AUDITORY SYNCHRONICITY: When audio mentions a concept (e.g., "your phone"), the delivery note must instruct the creator to hold up a phone or zoom onto a screen simultaneously. Audio and visual channels must reinforce each other.
2. THE 3-SECOND CUT RULE: Force visual scene changes every 3–4 seconds. Distribute visual cues evenly — camera angle changes, text overlays, asset placements. Maintain visual momentum at ALL times.

═══════════════════════════════════════════════════
EMOTIONAL JOURNEY STRUCTURE (Friction → Agitation → Relief)
═══════════════════════════════════════════════════
Every script MUST take the viewer on a mini emotional journey:
1. FRICTION LOOP: Open with high-tension problem — keeps heart rate up, captures early-retention metrics
2. AGITATION SPIKE: Increase tension — show what happens if the viewer keeps failing
3. RELIEF BEAT: Reveal the solution — shift to calmer, structured tone; adopt confident, reassuring delivery
The CONTRAST between tension (stages 1–2) and calm (stage 3) triggers a dopamine release, making viewers far more likely to SAVE the video or click the CTA.

═══════════════════════════════════════════════════
PLATFORM-SPECIFIC CTA DESIGN (Anti-Decision-Paralysis)
═══════════════════════════════════════════════════
Traditional CTAs like "Go to my website, sign up for my newsletter, and follow my page" create DECISION PARALYSIS and cause swipe-aways. Apply these three principles:

1. SINGLE ACTION BIAS: One direct, low-friction command only — NEVER multiple options
   ✅ "Comment NEMO down below" ❌ "Like, subscribe, and visit my website"

2. COMMENT-TO-DM TRIGGER: Driving comments is the most powerful signal in short-form ranking algorithms. Script CTAs that tell viewers to TYPE A SPECIFIC WORD to receive automatic details — this triggers high engagement AND starts a direct private conversion funnel via DM.
   ✅ "Comment SECRETS and I'll send you the exact beta link directly to your DMs"

3. VALUE-LED CTA: Always pair the conversion action with immediate, undeniable value.

PLATFORM CTA TONE GUIDE:
- Instagram Reels / YouTube Shorts (English): Punchy, direct, momentum-driven; active high-velocity verbs; short declarative sentences; no filler transitions
- TikTok / Reels (Hindi): Emotion-first; dramatic high-retention pauses; warm, conversational vernacular
- Youth-centric platforms (Hinglish): Casual like a voice note from a friend; blends Hindi expressions with English nouns; frictionless and colloquial

═══════════════════════════════════════════════════
LANGUAGE & CULTURAL PACING RULES
═══════════════════════════════════════════════════
- English: High-velocity pacing, punchy declarative sentences, no filler words, momentum-driven
- Hindi: Emotion-first, dramatic pauses for retention, warm vernacular, culturally resonant metaphors
- Hinglish: Casual friend-to-friend tone, blend Hindi expressions with English nouns, colloquial and frictionless
- Other languages: Maintain cultural nuance, adapt pacing to regional content consumption patterns

═══════════════════════════════════════════════════
OUTPUT FORMAT — RESPOND WITH VALID JSON ONLY
═══════════════════════════════════════════════════
{
  "versions": [
    {
      "id": "v1",
      "style": "hears",
      "styleLabel": "HEARS — Relatable & Informative",
      "hook": "Pattern interrupt opening line (first 3 seconds) — mid-sentence, curiosity gap",
      "body": "Full script body following HEARS: Empathy → Authority → Reason → Solution. Include visual-auditory sync cues in [brackets]. Scene changes every 3-4 seconds. Friction loop → agitation spike → relief beat emotional arc.",
      "cta": "Single-action comment-to-DM trigger with value-led offer",
      "viralScore": 88,
      "timestamps": ["0:00 - Pattern interrupt hook", "0:03 - Empathy validation", "0:10 - Authority proof", "0:20 - Reason/insight", "0:40 - Solution reveal", "0:55 - CTA"],
      "deliveryNotes": "Specific visual-auditory sync instructions, pacing cues, gesture directions, scene change timing"
    },
    {
      "id": "v2",
      "style": "paw",
      "styleLabel": "PAW — Motivational & Pain-Point",
      "hook": "...",
      "body": "Full script following PAW: Problem → Agitate → Win. Agitation spike must compound the negative consequences. Relief beat at Win stage.",
      "cta": "...",
      "viralScore": 84,
      "timestamps": [...],
      "deliveryNotes": "..."
    },
    {
      "id": "v3",
      "style": "c4",
      "styleLabel": "C4 — Captivate, Connect, Convince, Convert",
      "hook": "...",
      "body": "Full script following C4: Captivate → Connect → Convince → Convert. Bridge current state to desired future self. Proof points and metrics in Convince stage.",
      "cta": "...",
      "viralScore": 81,
      "timestamps": [...],
      "deliveryNotes": "..."
    }
  ]
}

QUALITY RULES:
- Hooks MUST use pattern interrupt (mid-sentence or curiosity gap) — never a greeting
- Body MUST follow the assigned framework structure explicitly
- Body MUST include visual-auditory sync cues in [brackets] (e.g., [hold phone to camera], [zoom in], [text overlay: "KEY STAT"])
- Body MUST reflect the emotional journey: friction → agitation → relief
- CTA MUST be a single-action comment-to-DM trigger with value
- Viral scores: realistic range 65–95
- Timestamps must match platform duration
- Delivery notes must specify exact visual-auditory synchronicity instructions and scene change timing`;

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScriptCard({ version, isSelected, onSelect }: { version: ScriptVersion; isSelected: boolean; onSelect: () => void }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fullScript = `HOOK:\n${version.hook}\n\nSCRIPT:\n${version.body}\n\nCALL TO ACTION:\n${version.cta}`;

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
      className={`card-surface border rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 ${
        isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/40'
      }`}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSelected ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
          <div className="min-w-0">
            <p className="text-sm font-sans font-semibold text-foreground truncate">{version.styleLabel}</p>
            <p className="text-xs text-muted-foreground font-sans">Version {version.id.replace('v', '')}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-mono-custom font-bold tabular-nums ${getScoreBg(version.viralScore)} ${getScoreColor(version.viralScore)}`}>
          <Icon name="FireIcon" size={14} variant="solid" />
          {version.viralScore}%
        </div>
      </div>

      {/* Hook preview */}
      <div className="px-4 pb-3">
        <div className="p-3 bg-primary/5 border border-primary/15 rounded-xl">
          <p className="text-xs font-mono-custom uppercase tracking-wide text-primary font-bold mb-1">⚡ Hook</p>
          <p className="text-sm font-sans text-foreground leading-relaxed italic">&ldquo;{version.hook}&rdquo;</p>
        </div>
      </div>

      {/* Expand toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
        className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-sans text-muted-foreground hover:text-foreground border-t border-border transition-colors"
      >
        <span>{expanded ? 'Hide full script' : 'View full script'}</span>
        <Icon name={expanded ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={14} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border animate-fade-in">
          {/* Body */}
          <div className="pt-3">
            <p className="text-xs font-mono-custom uppercase tracking-wide text-muted-foreground font-bold mb-2">Script Body</p>
            <p className="text-sm font-sans text-foreground leading-relaxed whitespace-pre-line">{version.body}</p>
          </div>

          {/* CTA */}
          <div className="p-3 bg-accent/5 border border-accent/15 rounded-xl">
            <p className="text-xs font-mono-custom uppercase tracking-wide text-accent font-bold mb-1">Call to Action</p>
            <p className="text-sm font-sans text-foreground">{version.cta}</p>
          </div>

          {/* Timestamps */}
          {version.timestamps?.length > 0 && (
            <div>
              <p className="text-xs font-mono-custom uppercase tracking-wide text-muted-foreground font-bold mb-2">Timestamps</p>
              <div className="space-y-1">
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
            <div className="p-3 bg-muted rounded-xl">
              <p className="text-xs font-mono-custom uppercase tracking-wide text-muted-foreground font-bold mb-1">🎬 Delivery Notes</p>
              <p className="text-xs font-sans text-muted-foreground leading-relaxed">{version.deliveryNotes}</p>
            </div>
          )}

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-sm font-sans font-semibold transition-colors"
          >
            <Icon name={copied ? 'CheckIcon' : 'ClipboardDocumentIcon'} size={16} />
            {copied ? 'Copied!' : 'Copy Full Script'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ViralScriptWriterContent() {
  const [topic, setTopic] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('youtube-shorts');
  const [selectedNiche, setSelectedNiche] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const [additionalContext, setAdditionalContext] = useState('');
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string>('v1');
  const [history, setHistory] = useState<GeneratedScript[]>([]);

  const resultsRef = useRef<HTMLDivElement>(null);

  const { response, isLoading, error, sendMessage } = useChat('GEMINI', 'gemini/gemini-2.5-flash-lite', false);

  useEffect(() => {
    if (error) toast.error(error.message);
  }, [error]);

  useEffect(() => {
    if (response && !isLoading) {
      const versions = parseScriptResponse(response);
      if (versions.length > 0) {
        const platform = PLATFORMS.find((p) => p.id === selectedPlatform);
        const newScript: GeneratedScript = {
          topic,
          platform: platform?.label || selectedPlatform,
          niche: selectedNiche,
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
    if (!topic.trim()) {
      toast.error('Please enter a topic first');
      return;
    }

    const platform = PLATFORMS.find((p) => p.id === selectedPlatform);

    // Determine language-specific CTA tone guidance
    const ctaToneGuide =
      selectedLanguage === 'Hindi' ?'Use emotion-first, dramatic high-retention pauses, warm conversational vernacular for the CTA.'
        : selectedLanguage === 'Hinglish' ?'Use casual friend-to-friend tone, blend Hindi expressions with English nouns, frictionless and colloquial CTA.' :'Use punchy, direct, momentum-driven CTA with active high-velocity verbs and short declarative sentences.';

    // Determine platform duration context for timestamps
    const platformDuration = platform?.duration || '60s';

    const userPrompt = `Apply the full NemoScript Viral Psychology system to generate 3 viral video script versions:

TOPIC: ${topic}
PLATFORM: ${platform?.label} (${platformDuration})
NICHE: ${selectedNiche || 'General'}
LANGUAGE: ${selectedLanguage}
CTA TONE: ${ctaToneGuide}
${additionalContext ? `ADDITIONAL CONTEXT: ${additionalContext}` : ''}

REQUIRED FRAMEWORK ASSIGNMENT:
- Version 1 (v1): Apply HEARS framework (Hook → Empathy → Authority → Reason → Solution) — optimized for relatable & informative content
- Version 2 (v2): Apply PAW framework (Problem → Agitate → Win/Workaround) — optimized for motivational & pain-point content  
- Version 3 (v3): Apply C4 framework (Captivate → Connect → Convince → Convert) — optimized for conversion & fast-paced delivery

MANDATORY REQUIREMENTS FOR ALL VERSIONS:
1. Hook MUST be a pattern interrupt — start mid-sentence or mid-action, use curiosity gap (never start with "Hey guys" or greetings)
2. Body MUST follow the assigned framework structure explicitly with each stage labeled
3. Body MUST include visual-auditory sync cues in [brackets] every 3-4 seconds (e.g., [zoom in], [hold product to camera], [text overlay: "STAT"])
4. Body MUST follow the emotional journey: Friction Loop → Agitation Spike → Relief Beat
5. CTA MUST be a single-action comment-to-DM trigger with value (e.g., "Comment NEMO and I'll DM you the exact template")
6. Timestamps must align with ${platform?.label} (${platformDuration}) pacing
7. Delivery notes must specify visual-auditory synchronicity, scene change timing (every 3-4 sec), and gesture cues

Generate scripts in ${selectedLanguage} language with appropriate cultural pacing and tone.`;

    sendMessage([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.85, max_tokens: 4000 });
  };

  const platform = PLATFORMS.find((p) => p.id === selectedPlatform);

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

            {/* Topic Input */}
            <div className="card-surface border border-border rounded-2xl p-5 space-y-4">
              <div>
                <h2 className="text-sm font-sans font-semibold text-foreground mb-1">Your Topic</h2>
                <p className="text-xs text-muted-foreground font-sans">Be specific — better topics generate better scripts</p>
              </div>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Why I quit my 9-to-5 to build a business, The protein mistake costing you gains, 5 AI tools that replaced my entire team..."
                rows={3}
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>

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

              {/* Additional context */}
              <div>
                <label className="text-xs font-mono-custom uppercase tracking-wide text-muted-foreground font-bold mb-2 block">Additional Context <span className="normal-case font-normal">(optional)</span></label>
                <textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Target audience, tone preference, key points to include..."
                  rows={2}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm font-sans text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isLoading || !topic.trim()}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl flame-gradient text-white font-sans font-bold text-base shadow-flame transition-all duration-200 hover:opacity-90 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating Scripts…
                </>
              ) : (
                <>
                  <Icon name="SparklesIcon" size={20} variant="solid" />
                  Generate Viral Scripts
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
                  Enter your topic, choose a platform, and let NemoScript apply HEARS, PAW & C4 frameworks with pattern interrupt psychology to craft 3 viral scripts.
                </p>
                <div className="mt-6 grid grid-cols-3 gap-3 w-full max-w-sm">
                  {[
                    { label: 'HEARS · PAW · C4', icon: 'DocumentDuplicateIcon' },
                    { label: 'Virality Score', icon: 'FireIcon' },
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

            {isLoading && (
              <div className="card-surface border border-border rounded-2xl p-10 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-2xl flame-gradient flex items-center justify-center">
                    <Icon name="SparklesIcon" size={28} className="text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-background animate-pulse" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-2">Crafting your scripts…</h3>
                <p className="text-sm font-sans text-muted-foreground max-w-xs leading-relaxed mb-6">
                  NemoScript is applying HEARS, PAW & C4 frameworks with pattern interrupt hooks and emotional journey engineering.
                </p>
                <div className="space-y-2 w-full max-w-xs">
                  {['Applying pattern interrupt hooks', 'Structuring HEARS · PAW · C4 frameworks', 'Engineering emotional journey arc', 'Calibrating virality scores & CTAs'].map((step, i) => (
                    <div key={step} className="flex items-center gap-3 text-sm font-sans text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <svg className="animate-spin w-3 h-3 text-primary" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      </div>
                      <span style={{ animationDelay: `${i * 0.3}s` }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {generatedScript && !isLoading && (
              <>
                {/* Result header */}
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

                {/* Script versions */}
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
