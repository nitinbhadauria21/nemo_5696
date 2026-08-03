import React from 'react';
import Link from 'next/link';
import { MOCK_TRENDS } from '@/lib/mockData';
import StatusBadge from '@/components/ui/StatusBadge';
import PlatformBadge from '@/components/ui/PlatformBadge';
import NemoScoreBadge from '@/components/ui/NemoScoreBadge';

const TOP_5 = [...MOCK_TRENDS]?.sort((a, b) => b?.nemoScore - a?.nemoScore)?.slice(0, 5);

export default function TopTrendsTable() {
  return (
    <div className="card-surface overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="text-xs font-mono-custom uppercase tracking-widest text-muted-foreground">
          Top Performing Trends This Period
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-2.5 text-left text-xs font-mono-custom uppercase tracking-widest text-muted-foreground">
                #
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-mono-custom uppercase tracking-widest text-muted-foreground">
                Trend
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-mono-custom uppercase tracking-widest text-muted-foreground">
                Platforms
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-mono-custom uppercase tracking-widest text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-mono-custom uppercase tracking-widest text-muted-foreground">
                Score
              </th>
            </tr>
          </thead>
          <tbody>
            {TOP_5?.map((trend, idx) => (
              <tr
                key={trend?.id}
                className="border-b border-border hover:bg-muted/40 transition-colors"
              >
                <td className="px-4 py-3 text-xs font-mono-custom text-muted-foreground tabular-nums">
                  {String(idx + 1)?.padStart(2, '0')}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/trend/${trend?.id}`}
                    className="text-sm font-sans font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                  >
                    {trend?.title}
                  </Link>
                  <p className="text-xs text-muted-foreground font-sans">{trend?.category}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {trend?.platforms?.slice(0, 2)?.map((p) => (
                      <PlatformBadge key={`top-plat-${trend?.id}-${p}`} platform={p} size="sm" />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={trend?.status} size="sm" />
                </td>
                <td className="px-4 py-3 text-right">
                  <NemoScoreBadge score={trend?.nemoScore} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
