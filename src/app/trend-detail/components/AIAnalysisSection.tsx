'use client';

import React, { useState } from 'react';
import { Sparkles, Shield, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

type AnalysisType = 'analysis' | 'sentiment' | 'ideas';

interface AIAnalysisSectionProps {
  type: AnalysisType;
  trendTitle: string;
}

const SECTION_CONFIG: Record<
  AnalysisType,
  {
    icon: React.ElementType;
    label: string;
    description: string;
    accentClass: string;
  }
> = {
  analysis: {
    icon: Sparkles,
    label: 'Trend Analysis',
    description: 'AI breakdown of why this trend is gaining traction',
    accentClass: 'text-primary bg-primary/10 border-primary/20',
  },
  sentiment: {
    icon: Shield,
    label: 'Sentiment & Safety',
    description: 'Brand safety score and audience sentiment analysis',
    accentClass: 'text-accent bg-accent/10 border-accent/20',
  },
  ideas: {
    icon: Lightbulb,
    label: 'Content Ideas',
    description: '5 AI-generated content angles ready to post',
    accentClass: 'text-secondary bg-secondary/10 border-secondary/20',
  },
};

const MOCK_ANALYSIS: Record<AnalysisType, React.ReactNode> = {
  analysis: (
    <div className="space-y-3 text-sm font-sans text-foreground leading-relaxed">
      <p>
        <strong>Why it&apos;s trending:</strong> Claude AI tool integrations have hit a critical
        mass inflection point. The release of Claude Sonnet 4.5 with native tool use capabilities
        has unlocked a wave of developer and creator tutorials showing real workflows — from
        automated content pipelines to research agents.
      </p>
      <p>
        <strong>Creator pattern:</strong> Tech YouTubers are leading with &quot;I replaced my entire
        content workflow with Claude&quot; style videos. LinkedIn influencers are publishing
        step-by-step MCP integration guides targeting non-technical marketers.
      </p>
      <p>
        <strong>Momentum signal:</strong> CVS of 0.88 means 88% of creators who covered this topic
        72h ago are still posting — indicating sustained interest rather than a flash spike.
        Cross-platform presence on Google, YouTube, and LinkedIn confirms mainstream adoption beyond
        early tech adopters.
      </p>
      <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
        <p className="text-xs font-mono-custom text-primary font-bold uppercase tracking-wide mb-1">
          ⚡ Trend Window
        </p>
        <p className="text-xs text-muted-foreground">
          This trend is in its growth phase. Optimal posting window: next 18–36 hours before
          saturation.
        </p>
      </div>
    </div>
  ),
  sentiment: (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            id: 'sent-overall',
            label: 'Sentiment',
            value: '87%',
            sub: 'Positive',
            color: 'text-accent',
          },
          {
            id: 'sent-safety',
            label: 'Brand Safe',
            value: '94/100',
            sub: 'High safety',
            color: 'text-accent',
          },
          {
            id: 'sent-controversy',
            label: 'Controversy',
            value: 'Low',
            sub: 'Minimal risk',
            color: 'text-secondary',
          },
        ].map((metric) => (
          <div key={metric.id} className="card-surface p-3 text-center">
            <p className="text-xs font-mono-custom uppercase tracking-wide text-muted-foreground mb-1">
              {metric.label}
            </p>
            <p className={`text-xl font-mono-custom font-bold tabular-nums ${metric.color}`}>
              {metric.value}
            </p>
            <p className="text-xs text-muted-foreground font-sans">{metric.sub}</p>
          </div>
        ))}
      </div>
      <p className="text-sm font-sans text-foreground leading-relaxed">
        Audience sentiment around Claude AI integrations is overwhelmingly positive. The dominant
        narrative is productivity empowerment rather than job displacement — making this safe for
        brands across B2B and creator verticals. No significant controversy detected.
      </p>
      <div className="p-3 bg-accent/5 border border-accent/20 rounded-xl">
        <p className="text-xs font-mono-custom text-accent font-bold uppercase tracking-wide mb-1">
          ✅ Brand Safety Verdict
        </p>
        <p className="text-xs text-muted-foreground">
          Safe for all brand categories. Particularly well-suited for SaaS, productivity tools, and
          creator economy brands.
        </p>
      </div>
    </div>
  ),
  ideas: (
    <div className="space-y-3">
      {[
        {
          id: 'idea-001',
          hook: 'I automated my entire content calendar using Claude AI',
          angle: 'Step-by-step tutorial showing the exact MCP configuration',
          viral: 92,
        },
        {
          id: 'idea-002',
          hook: 'Stop spending 4 hours on content research — let Claude do it',
          angle: 'Productivity transformation story with before/after time comparison',
          viral: 88,
        },
        {
          id: 'idea-003',
          hook: 'The Claude tool nobody in your niche is using yet',
          angle: 'First-mover advantage angle for early adopters in non-tech niches',
          viral: 84,
        },
        {
          id: 'idea-004',
          hook: 'I asked Claude to be my trend strategist for 7 days',
          angle: 'Experiment-style content with real results and metrics',
          viral: 79,
        },
        {
          id: 'idea-005',
          hook: 'Claude vs ChatGPT for content creation — honest breakdown',
          angle: 'Comparison content capitalizing on existing platform debate',
          viral: 76,
        },
      ].map((idea) => (
        <div key={idea.id} className="p-3 bg-muted rounded-xl border border-border">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <p className="text-sm font-sans font-semibold text-foreground leading-snug">
              &quot;{idea.hook}&quot;
            </p>
            <span className="flex-shrink-0 text-xs font-mono-custom font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full tabular-nums">
              {idea.viral}% viral
            </span>
          </div>
          <p className="text-xs font-sans text-muted-foreground">{idea.angle}</p>
        </div>
      ))}
    </div>
  ),
};

export default function AIAnalysisSection({ type, trendTitle }: AIAnalysisSectionProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const config = SECTION_CONFIG[type];
  const IconComponent = config.icon;

  const [liveContent, setLiveContent] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    const endpoints: Record<AnalysisType, string> = {
      analysis: '/api/trends/analyze',
      sentiment: '/api/trends/sentiment',
      ideas: '/api/trends/generate-ideas',
    };
    try {
      const res = await fetch(endpoints[type], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trendTitle }),
      });
      const data = await res.json();
      const text =
        data.analysis || data.sentiment || data.ideas || data.error || 'Analysis unavailable';
      setLiveContent(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
      setIsLoaded(true);
      setIsExpanded(true);
    } catch {
      setLiveContent('Failed to load analysis. Check your AI provider keys.');
      setIsLoaded(true);
      setIsExpanded(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`card-surface border ${config.accentClass} overflow-hidden`}>
      <button
        className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
        onClick={() => {
          if (isLoaded) setIsExpanded((e) => !e);
          else handleAnalyze();
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.accentClass}`}
          >
            <IconComponent size={16} />
          </div>
          <div className="text-left">
            <p className="text-sm font-sans font-semibold text-foreground">{config.label}</p>
            <p className="text-xs text-muted-foreground font-sans">{config.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isLoaded && !isLoading && (
            <span className="text-xs font-sans font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              Run Analysis
            </span>
          )}
          {isLoading && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
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
              Analyzing…
            </div>
          )}
          {isLoaded &&
            (isExpanded ? (
              <ChevronUp size={16} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={16} className="text-muted-foreground" />
            ))}
        </div>
      </button>

      {isLoaded && isExpanded && (
        <div className="px-4 pb-4 animate-fade-in">
          <div className="pt-3 border-t border-border">
            {liveContent ? (
              <pre className="text-sm font-sans whitespace-pre-wrap text-foreground leading-relaxed">
                {liveContent}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">No analysis returned.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
