'use client';

import React, { useState } from 'react';
import { Sparkles, Shield, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { friendlyAiError } from '@/lib/ai/aiClient';
import TrendAnalysisResult, { LightMarkdown, type TrendAnalysisData } from './TrendAnalysisResult';
import SentimentSafetyResult, {
  parseSentimentPayload,
  type SentimentSafetyData,
} from './SentimentSafetyResult';
import ContentIdeasResult, {
  parseIdeasFromMarkdown,
  parseIdeasPayload,
  type ContentIdea,
} from './ContentIdeasResult';

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

function extractRawText(data: Record<string, unknown>, type: AnalysisType): string {
  const key = type === 'analysis' ? 'analysis' : type === 'sentiment' ? 'sentiment' : 'ideas';
  const value = data[key];
  if (typeof value === 'string') return value;
  if (value != null) return JSON.stringify(value, null, 2);
  return 'Analysis unavailable';
}

function parseAnalysisPayload(raw: string): TrendAnalysisData | null {
  const text = (raw || '').trim();
  if (!text) return null;
  try {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced?.[1]?.trim() || text;
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    const parsed = JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;

    const whyTrending = Array.isArray(parsed.whyTrending)
      ? parsed.whyTrending.map((x) => String(x)).filter(Boolean)
      : Array.isArray(parsed.why_trending)
        ? (parsed.why_trending as unknown[]).map((x) => String(x)).filter(Boolean)
        : [];

    const bestPlatforms = Array.isArray(parsed.bestPlatforms)
      ? parsed.bestPlatforms.map((x) => String(x)).filter(Boolean)
      : Array.isArray(parsed.best_platforms)
        ? (parsed.best_platforms as unknown[]).map((x) => String(x)).filter(Boolean)
        : Array.isArray(parsed.platforms)
          ? (parsed.platforms as unknown[]).map((x) => String(x)).filter(Boolean)
          : [];

    if (!whyTrending.length && !parsed.trajectory && !parsed.summary) return null;

    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary : undefined,
      whyTrending,
      trajectory:
        typeof parsed.trajectory === 'string'
          ? parsed.trajectory
          : typeof parsed.predictedTrajectory === 'string'
            ? parsed.predictedTrajectory
            : undefined,
      bestPlatforms,
    };
  } catch {
    return null;
  }
}

export default function AIAnalysisSection({ type, trendTitle }: AIAnalysisSectionProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [liveContent, setLiveContent] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<TrendAnalysisData | null>(null);
  const [sentimentData, setSentimentData] = useState<SentimentSafetyData | null>(null);
  const [ideasData, setIdeasData] = useState<ContentIdea[]>([]);

  const config = SECTION_CONFIG[type];
  const IconComponent = config.icon;

  const resetResultState = () => {
    setLiveContent(null);
    setAnalysisData(null);
    setSentimentData(null);
    setIdeasData([]);
    setIsError(false);
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setIsError(false);
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
      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok || data.error) {
        setLiveContent(friendlyAiError(data.error, res.status));
        setIsError(true);
        setAnalysisData(null);
        setSentimentData(null);
        setIdeasData([]);
      } else {
        const text = extractRawText(data, type);
        setLiveContent(text);
        setIsError(false);

        if (type === 'analysis') {
          setAnalysisData(parseAnalysisPayload(text));
        } else if (type === 'sentiment') {
          setSentimentData(parseSentimentPayload(text));
        } else {
          const fromJson = parseIdeasPayload(text);
          setIdeasData(fromJson ?? parseIdeasFromMarkdown(text));
        }
      }
      setIsLoaded(true);
      setIsExpanded(true);
    } catch {
      setLiveContent(friendlyAiError('ai_unavailable', 503));
      setIsError(true);
      setIsLoaded(true);
      setIsExpanded(true);
    } finally {
      setIsLoading(false);
    }
  };

  const renderBody = () => {
    if (!liveContent) {
      return <p className="text-sm text-muted-foreground">No analysis returned.</p>;
    }
    if (isError) {
      return <p className="text-sm font-sans text-destructive leading-relaxed">{liveContent}</p>;
    }

    if (type === 'analysis') {
      if (analysisData) return <TrendAnalysisResult data={analysisData} />;
      return <LightMarkdown text={liveContent} />;
    }

    if (type === 'sentiment') {
      if (sentimentData) {
        return <SentimentSafetyResult data={sentimentData} />;
      }
      return (
        <SentimentSafetyResult
          data={{ sentiment: 'neutral', brandSafety: 'caution', summary: '', risks: [] }}
          fallbackMarkdown={liveContent}
        />
      );
    }

    if (ideasData.length > 0) {
      return <ContentIdeasResult ideas={ideasData} />;
    }
    return <ContentIdeasResult ideas={[]} fallbackMarkdown={liveContent} />;
  };

  return (
    <div className={`card-surface border ${config.accentClass} overflow-hidden`}>
      <button
        type="button"
        className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
        onClick={() => {
          if (isLoaded) setIsExpanded((e) => !e);
          else void handleAnalyze();
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
            {renderBody()}
            {isError && (
              <button
                type="button"
                className="mt-3 text-xs font-semibold text-primary hover:underline"
                onClick={() => {
                  setIsLoaded(false);
                  setIsExpanded(false);
                  resetResultState();
                }}
              >
                Dismiss and try again
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
