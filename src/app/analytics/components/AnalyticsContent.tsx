'use client';

import React, { useState } from 'react';
import AnalyticsKPICards from './AnalyticsKPICards';
import ViewsBarChart from './ViewsBarChart';
import EngagementLineChart from './EngagementLineChart';
import PlatformPieChart from './PlatformPieChart';
import BestTimeHeatmap from './BestTimeHeatmap';
import TopTrendsTable from './TopTrendsTable';
import CountrySelector from '@/components/ui/CountrySelector';
import { COUNTRIES } from '@/lib/countries';

const RANGES = ['7d', '30d', '90d'];

export default function AnalyticsContent() {
  const [range, setRange] = useState('30d');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  const selectedCountryNames = selectedCountries
    .map((code) => COUNTRIES.find((c) => c.code === code))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/98 backdrop-blur border-b border-border px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-base text-foreground/65 font-sans">Performance insights for your content strategy</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Country selector */}
          <CountrySelector
            selectedCountries={selectedCountries}
            onChange={setSelectedCountries}
            compact
          />
          {/* Range selector */}
          <div className="flex gap-1 bg-muted rounded-full p-1">
            {RANGES?.map((r) => (
              <button
                key={`range-${r}`}
                onClick={() => setRange(r)}
                className={`px-4 py-1.5 rounded-full text-sm font-mono-custom font-bold uppercase transition-all duration-150 ${
                  range === r ? 'bg-primary text-white shadow-flame-sm' : 'text-foreground/65 hover:text-foreground'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 py-4 max-w-screen-2xl mx-auto space-y-4">
        {/* Active country filter banner */}
        {selectedCountryNames.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-base font-sans">
            <span className="text-primary font-semibold">📍 Analytics filtered for:</span>
            <span className="text-foreground">
              {selectedCountryNames.map((c) => `${c!.flag} ${c!.name}`).join(' · ')}
            </span>
          </div>
        )}

        {/* KPI cards */}
        <AnalyticsKPICards />

        {/* Main chart + pie */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2">
            <ViewsBarChart />
          </div>
          <div>
            <PlatformPieChart />
          </div>
        </div>

        {/* Engagement + heatmap */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <EngagementLineChart />
          <BestTimeHeatmap />
        </div>

        {/* Top trends table */}
        <TopTrendsTable />
      </div>
    </div>
  );
}