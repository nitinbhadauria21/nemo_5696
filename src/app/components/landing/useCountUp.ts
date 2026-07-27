'use client';

import { useEffect } from 'react';

export function useCountUp(rootRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const els = root.querySelectorAll<HTMLElement>('[data-count]');
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          cio.unobserve(el);

          const target = parseFloat(el.dataset.count || '0');
          const suffix = el.dataset.suffix || '';
          const dec = parseInt(el.dataset.dec || '0', 10);
          const t0 = performance.now();
          const dur = 1400;

          function tick(t: number) {
            const p = Math.min((t - t0) / dur, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            el.textContent = (target * ease).toFixed(dec) + suffix;
            if (p < 1) requestAnimationFrame(tick);
          }

          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.5 }
    );

    els.forEach((el) => cio.observe(el));
    return () => cio.disconnect();
  }, [rootRef]);
}
