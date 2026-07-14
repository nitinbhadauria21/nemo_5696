import React from 'react';

export default function LiveBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent/10 border border-accent/30 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-accent live-pulse" />
      <span className="text-xs font-mono-custom font-bold uppercase tracking-widest text-accent">
        LIVE
      </span>
    </div>
  );
}