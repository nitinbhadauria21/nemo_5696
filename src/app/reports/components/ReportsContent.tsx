'use client';

import React, { useEffect, useState } from 'react';
import { LockClosedIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';

const TREND_TIMING_DATA = [
  { hour: '6am', score: 42, volume: 1200 },
  { hour: '8am', score: 58, volume: 2800 },
  { hour: '10am', score: 71, volume: 4100 },
  { hour: '12pm', score: 88, volume: 6200 },
  { hour: '2pm', score: 79, volume: 5400 },
  { hour: '4pm', score: 65, volume: 3900 },
  { hour: '6pm', score: 91, volume: 7100 },
  { hour: '8pm', score: 84, volume: 6600 },
  { hour: '10pm', score: 72, volume: 4800 },
  { hour: '12am', score: 45, volume: 1900 },
];

const TOP_TRENDS = [
  {
    rank: 1,
    title: 'Claude AI Tool Integrations',
    nemoScore: 91,
    platform: 'YouTube',
    change: '+312%',
  },
  {
    rank: 2,
    title: 'Instagram Broadcast Channels',
    nemoScore: 84,
    platform: 'Instagram',
    change: '+188%',
  },
  {
    rank: 3,
    title: 'Viral Finance Hacks 2026',
    nemoScore: 78,
    platform: 'TikTok',
    change: '+145%',
  },
  {
    rank: 4,
    title: 'Morning Routine Productivity',
    nemoScore: 74,
    platform: 'Instagram',
    change: '+98%',
  },
  { rank: 5, title: 'AI Tools for Creators', nemoScore: 71, platform: 'YouTube', change: '+87%' },
  { rank: 6, title: 'Budget Travel India 2026', nemoScore: 68, platform: 'TikTok', change: '+76%' },
  {
    rank: 7,
    title: 'Healthy Meal Prep Ideas',
    nemoScore: 65,
    platform: 'Instagram',
    change: '+65%',
  },
  { rank: 8, title: 'Crypto Market Analysis', nemoScore: 62, platform: 'YouTube', change: '+54%' },
  { rank: 9, title: 'Gaming Setup Tour 2026', nemoScore: 59, platform: 'TikTok', change: '+43%' },
  {
    rank: 10,
    title: 'Remote Work Productivity',
    nemoScore: 55,
    platform: 'LinkedIn',
    change: '+32%',
  },
];

const NICHE_DATA = [
  { niche: 'AI & Tech', trends: 48, avgScore: 82 },
  { niche: 'Finance', trends: 35, avgScore: 74 },
  { niche: 'Fitness', trends: 29, avgScore: 68 },
  { niche: 'Marketing', trends: 24, avgScore: 71 },
  { niche: 'Travel', trends: 18, avgScore: 63 },
  { niche: 'Food', trends: 15, avgScore: 59 },
];

const PLATFORM_COLORS: Record<string, string> = {
  YouTube: 'bg-red-500/10 text-red-600 border border-red-500/20',
  Instagram: 'bg-pink-500/10 text-pink-600 border border-pink-500/20',
  TikTok: 'bg-slate-500/10 text-slate-600 border border-slate-500/20',
  LinkedIn: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
};

export default function ReportsContent() {
  const [isPro, setIsPro] = useState(false);
  const [topTrends, setTopTrends] = useState(TOP_TRENDS);
  const [nicheData, setNicheData] = useState(NICHE_DATA);
  const [timingData, setTimingData] = useState(TREND_TIMING_DATA);

  useEffect(() => {
    try {
      const plan = localStorage.getItem('nemo_plan');
      setIsPro(plan === 'pro' || plan === 'agency');
    } catch {
      setIsPro(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/trends')
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data.trends) || !data.trends.length) return;
        const sorted = [...data.trends].sort(
          (a: { nemoScore: number }, b: { nemoScore: number }) => b.nemoScore - a.nemoScore
        );
        setTopTrends(
          sorted
            .slice(0, 10)
            .map(
              (
                t: { title: string; nemoScore: number; platforms: string[]; spike: number },
                i: number
              ) => ({
                rank: i + 1,
                title: t.title,
                nemoScore: t.nemoScore,
                platform: t.platforms[0]
                  ? t.platforms[0].charAt(0).toUpperCase() + t.platforms[0].slice(1)
                  : 'Multi',
                change: `${t.spike >= 0 ? '+' : ''}${t.spike}%`,
              })
            )
        );
        const byNiche = new Map<string, { trends: number; total: number }>();
        for (const t of data.trends as { category: string; nemoScore: number }[]) {
          const cur = byNiche.get(t.category) || { trends: 0, total: 0 };
          cur.trends += 1;
          cur.total += t.nemoScore;
          byNiche.set(t.category, cur);
        }
        setNicheData(
          [...byNiche.entries()]
            .map(([niche, v]) => ({
              niche,
              trends: v.trends,
              avgScore: Math.round(v.total / v.trends),
            }))
            .sort((a, b) => b.trends - a.trends)
            .slice(0, 6)
        );
        const sample = sorted[0] as { sparklineData?: number[] } | undefined;
        if (sample?.sparklineData?.length) {
          setTimingData(
            sample.sparklineData.map((score, i) => ({
              hour: `${i * 3}h`,
              score,
              volume: score * 80,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/98 backdrop-blur-md border-b border-border px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flame-gradient flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Reports</h1>
            <p className="text-base text-foreground/65 font-sans mt-0.5">
              Trend timing analysis · Week of Jul 14, 2026
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            disabled={!isPro}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-base font-bold transition-all ${
              isPro
                ? 'bg-primary text-white hover:bg-primary/90'
                : 'bg-muted text-foreground/55 cursor-not-allowed border-2 border-border'
            }`}
            title={!isPro ? 'Pro feature — upgrade to download PDF' : 'Download PDF Report'}
          >
            {!isPro && <LockClosedIcon className="w-4 h-4" />}
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span className="hidden sm:inline font-bold">Download PDF</span>
            {!isPro && (
              <span className="text-sm bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-full font-bold ml-1">
                Pro
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-5 py-4 max-w-screen-xl mx-auto space-y-5">
        {/* Trend Timing Chart */}
        <div className="bg-card border-2 border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-bold text-foreground text-xl">Trend Timing Chart</h2>
              <p className="text-base text-foreground/65 font-sans mt-0.5">
                Best hours to post based on trend activity
              </p>
            </div>
            <span className="font-mono-custom text-sm font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-full">
              Today
            </span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={timingData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)', fontWeight: 600 }}
              />
              <YAxis tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--card)',
                  border: '2px solid var(--border)',
                  borderRadius: 12,
                  fontSize: 13,
                }}
                labelStyle={{ color: 'var(--foreground)', fontWeight: 700 }}
              />
              <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600 }} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#FF4500"
                strokeWidth={3}
                dot={{ r: 4 }}
                name="Nemo Score"
              />
              <Line
                type="monotone"
                dataKey="volume"
                stroke="#FFB800"
                strokeWidth={2.5}
                dot={false}
                name="Volume"
                strokeDasharray="4 2"
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-sm text-muted-foreground font-sans mt-3 text-center font-medium">
            🔥 Peak posting windows: <strong className="text-foreground">12pm – 2pm</strong> and{' '}
            <strong className="text-foreground">6pm – 8pm</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Top 10 Trends */}
          <div className="bg-card border-2 border-border rounded-2xl p-5">
            <h2 className="font-display font-bold text-foreground text-xl mb-5">
              Top 10 Trends This Week
            </h2>
            <div className="space-y-3">
              {topTrends.map((trend) => (
                <div key={`top-${trend.rank}`} className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      trend.rank <= 3 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {trend.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold font-sans text-foreground truncate">
                      {trend.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${PLATFORM_COLORS[trend.platform] || 'bg-muted text-muted-foreground'}`}
                      >
                        {trend.platform}
                      </span>
                      <span className="text-sm text-accent font-bold font-sans">
                        {trend.change}
                      </span>
                    </div>
                  </div>
                  <span className="text-lg font-mono-custom font-extrabold text-primary flex-shrink-0">
                    {trend.nemoScore}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Niche Summary Bar Chart */}
          <div className="bg-card border-2 border-border rounded-2xl p-5">
            <h2 className="font-display font-bold text-foreground text-xl mb-5">
              Niche Performance Summary
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={nicheData}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)', fontWeight: 600 }}
                />
                <YAxis
                  dataKey="niche"
                  type="category"
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)', fontWeight: 600 }}
                  width={75}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '2px solid var(--border)',
                    borderRadius: 12,
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="trends" fill="#FF4500" radius={[0, 6, 6, 0]} name="Trends" />
                <Bar dataKey="avgScore" fill="#FFB800" radius={[0, 6, 6, 0]} name="Avg Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PDF Download — Pro gated */}
        {!isPro && (
          <div className="relative rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-10 text-center overflow-hidden">
            <div className="absolute inset-0 backdrop-blur-[2px] bg-background/60 flex flex-col items-center justify-center z-10 rounded-2xl">
              <LockClosedIcon className="w-10 h-10 text-primary mb-4" />
              <h3 className="font-display text-2xl font-extrabold text-foreground mb-2">
                PDF Reports — Pro Feature
              </h3>
              <p className="text-base text-muted-foreground font-sans mb-5 max-w-xs">
                Download weekly trend reports as beautifully formatted PDFs. Upgrade to Pro to
                unlock.
              </p>
              <a href="/pricing" className="btn-flame px-6 py-3 text-base rounded-xl">
                Upgrade to Pro — ₹799/mo
              </a>
            </div>
            <div className="blur-sm pointer-events-none">
              <div className="h-32 bg-muted rounded-xl" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
