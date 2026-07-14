'use client';

import React, { useState } from 'react';
import { RefreshCw, ExternalLink, ThumbsUp, MessageCircle, Eye, TrendingUp } from 'lucide-react';
import PlatformBadge from '@/components/ui/PlatformBadge';

interface TrendingPost {
  id: string;
  user: string;
  handle: string;
  content: string;
  metric1Label: string;
  metric1Value: string;
  metric2Label: string;
  metric2Value: string;
  timeAgo: string;
  platform: 'youtube' | 'instagram' | 'linkedin' | 'google';
}

interface PlatformSection {
  platform: 'youtube' | 'instagram' | 'linkedin' | 'google';
  label: string;
  color: string;
  posts: TrendingPost[];
}

const PLATFORM_SECTIONS: PlatformSection[] = [
  {
    platform: 'youtube',
    label: 'YouTube',
    color: 'text-red-500',
    posts: [
      {
        id: 'yt-1',
        user: 'TechWithTim',
        handle: '@TechWithTim',
        content: 'I built a full Claude AI agent with MCP tools in 20 minutes — here\'s the exact setup 🔥',
        metric1Label: 'Views',
        metric1Value: '284K',
        metric2Label: 'Likes',
        metric2Value: '18.2K',
        timeAgo: '1h ago',
        platform: 'youtube',
      },
      {
        id: 'yt-2',
        user: 'AI Explained',
        handle: '@AIExplained',
        content: 'Claude vs GPT-4 for tool integrations — the results surprised me',
        metric1Label: 'Views',
        metric1Value: '142K',
        metric2Label: 'Comments',
        metric2Value: '3.4K',
        timeAgo: '3h ago',
        platform: 'youtube',
      },
      {
        id: 'yt-3',
        user: 'Fireship',
        handle: '@Fireship',
        content: 'Claude MCP in 100 seconds — the fastest way to add AI tools to your app',
        metric1Label: 'Views',
        metric1Value: '98K',
        metric2Label: 'Likes',
        metric2Value: '9.1K',
        timeAgo: '5h ago',
        platform: 'youtube',
      },
    ],
  },
  {
    platform: 'instagram',
    label: 'Instagram',
    color: 'text-pink-500',
    posts: [
      {
        id: 'ig-1',
        user: 'aicreatorsclub',
        handle: '@aicreatorsclub',
        content: 'Claude AI just changed how I create content. Here\'s my full workflow 👇 #ClaudeAI #AITools',
        metric1Label: 'Likes',
        metric1Value: '47.3K',
        metric2Label: 'Saves',
        metric2Value: '12.8K',
        timeAgo: '45m ago',
        platform: 'instagram',
      },
      {
        id: 'ig-2',
        user: 'techreels.daily',
        handle: '@techreels.daily',
        content: 'POV: You discover Claude MCP and automate your entire content pipeline 🤖✨',
        metric1Label: 'Likes',
        metric1Value: '31.6K',
        metric2Label: 'Shares',
        metric2Value: '4.2K',
        timeAgo: '2h ago',
        platform: 'instagram',
      },
      {
        id: 'ig-3',
        user: 'buildinpublic',
        handle: '@buildinpublic',
        content: 'Day 7 of building with Claude AI tools — here\'s what I learned #BuildInPublic #LLM',
        metric1Label: 'Likes',
        metric1Value: '18.9K',
        metric2Label: 'Comments',
        metric2Value: '892',
        timeAgo: '4h ago',
        platform: 'instagram',
      },
    ],
  },
  {
    platform: 'linkedin',
    label: 'LinkedIn',
    color: 'text-blue-600',
    posts: [
      {
        id: 'li-1',
        user: 'Lenny Rachitsky',
        handle: 'Product Advisor',
        content: 'Claude AI tool integrations are the biggest productivity unlock I\'ve seen in 10 years. Here\'s how we\'re using it at our portfolio companies...',
        metric1Label: 'Reactions',
        metric1Value: '8.4K',
        metric2Label: 'Reposts',
        metric2Value: '1.2K',
        timeAgo: '2h ago',
        platform: 'linkedin',
      },
      {
        id: 'li-2',
        user: 'Shreya Doshi',
        handle: 'PM Coach',
        content: 'I replaced 3 tools with Claude MCP integrations. The ROI is insane. Thread on how 👇',
        metric1Label: 'Reactions',
        metric1Value: '5.1K',
        metric2Label: 'Comments',
        metric2Value: '347',
        timeAgo: '4h ago',
        platform: 'linkedin',
      },
      {
        id: 'li-3',
        user: 'Andrej Karpathy',
        handle: 'AI Researcher',
        content: 'The MCP protocol for Claude is genuinely impressive engineering. Here\'s a technical breakdown of why it matters for enterprise AI adoption.',
        metric1Label: 'Reactions',
        metric1Value: '12.7K',
        metric2Label: 'Reposts',
        metric2Value: '2.8K',
        timeAgo: '6h ago',
        platform: 'linkedin',
      },
    ],
  },
  {
    platform: 'google',
    label: 'Google Trends',
    color: 'text-green-600',
    posts: [
      {
        id: 'gt-1',
        user: 'Breakout Query',
        handle: 'claude ai mcp setup',
        content: 'Search interest surged +5,400% in the last 24h — breakout query in US, UK, India',
        metric1Label: 'Interest',
        metric1Value: '100/100',
        metric2Label: 'Regions',
        metric2Value: '42',
        timeAgo: '15m ago',
        platform: 'google',
      },
      {
        id: 'gt-2',
        user: 'Rising Query',
        handle: 'claude tool use tutorial',
        content: 'Rising +1,200% — primarily driven by developer searches in North America and Europe',
        metric1Label: 'Interest',
        metric1Value: '87/100',
        metric2Label: 'Regions',
        metric2Value: '28',
        timeAgo: '30m ago',
        platform: 'google',
      },
      {
        id: 'gt-3',
        user: 'Related Query',
        handle: 'anthropic claude api integration',
        content: 'Steady climb +312% over 7 days — co-searched with "openai vs claude" and "best ai tools 2026"',
        metric1Label: 'Interest',
        metric1Value: '74/100',
        metric2Label: 'Regions',
        metric2Value: '35',
        timeAgo: '1h ago',
        platform: 'google',
      },
    ],
  },
];

const MetricIcon = ({ label }: { label: string }) => {
  if (label === 'Views') return <Eye size={10} className="inline mr-0.5" />;
  if (label === 'Likes' || label === 'Reactions') return <ThumbsUp size={10} className="inline mr-0.5" />;
  if (label === 'Comments') return <MessageCircle size={10} className="inline mr-0.5" />;
  return <TrendingUp size={10} className="inline mr-0.5" />;
};

export default function RealTimeTrendingPosts() {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState('Just now');

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setLastRefreshed('Just now');
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground">
            Live Trending Posts
          </h3>
          <p className="text-xs font-sans text-muted-foreground mt-0.5">Updated {lastRefreshed}</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1 text-xs text-primary hover:underline font-sans"
        >
          <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Platform sections */}
      {PLATFORM_SECTIONS.map((section) => (
        <div key={section.platform} className="card-surface p-4">
          {/* Platform header */}
          <div className="flex items-center gap-2 mb-3">
            <PlatformBadge platform={section.platform} size="sm" />
            <span className="text-xs font-mono-custom font-semibold text-foreground">{section.label}</span>
            <span className="ml-auto flex items-center gap-1 text-xs font-sans text-accent">
              <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block animate-pulse" />
              Live
            </span>
          </div>

          {/* Posts */}
          <div className="space-y-3">
            {section.posts.map((post, idx) => (
              <div
                key={post.id}
                className={`pb-3 ${idx < section.posts.length - 1 ? 'border-b border-border' : ''}`}
              >
                {/* User row */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0">
                    <span className="text-xs font-sans font-semibold text-foreground truncate block">
                      {post.user}
                    </span>
                    <span className="text-xs font-sans text-muted-foreground truncate block">
                      {post.handle}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs font-sans text-muted-foreground">{post.timeAgo}</span>
                    <ExternalLink size={10} className="text-muted-foreground" />
                  </div>
                </div>

                {/* Content */}
                <p className="text-xs font-sans text-foreground leading-relaxed mb-2 line-clamp-2">
                  {post.content}
                </p>

                {/* Metrics */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono-custom text-muted-foreground">
                    <MetricIcon label={post.metric1Label} />
                    <span className="font-bold text-foreground">{post.metric1Value}</span>
                    {' '}{post.metric1Label}
                  </span>
                  <span className="text-xs font-mono-custom text-muted-foreground">
                    <MetricIcon label={post.metric2Label} />
                    <span className="font-bold text-foreground">{post.metric2Value}</span>
                    {' '}{post.metric2Label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
