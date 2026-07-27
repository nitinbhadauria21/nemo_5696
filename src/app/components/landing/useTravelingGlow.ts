'use client';

import { useEffect } from 'react';

export function useTravelingGlow(rootRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const glow = root.querySelector<HTMLElement>('#world .travel-glow');
    if (!glow) return;

    let raf: number | null = null;

    const upd = () => {
      raf = null;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      glow.style.top = `${12 + p * 70}%`;
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(upd);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    upd();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [rootRef]);
}
