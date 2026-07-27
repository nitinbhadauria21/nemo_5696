'use client';

import { useEffect } from 'react';

export function useHeroParallax(rootRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const hero = root.querySelector('.hero');
    const layers = [...root.querySelectorAll<HTMLElement>('.hero [data-parallax]')];
    if (!hero || !layers.length) return;

    let mx = 0;
    let my = 0;
    let tx = 0;
    let ty = 0;
    let scroll = 0;
    let raf: number | null = null;

    const onMove = (e: MouseEvent) => {
      const r = hero.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      my = ((e.clientY - r.top) / r.height - 0.5) * 2;
      schedule();
    };

    const onScroll = () => {
      scroll = window.scrollY;
      schedule();
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const apply = () => {
      raf = null;
      tx += (mx - tx) * 0.08;
      ty += (my - ty) * 0.08;
      layers.forEach((l) => {
        const d = parseFloat(l.dataset.parallax || '0.1');
        const px = tx * d * 40;
        const py = ty * d * 40 + scroll * d * 0.35;
        l.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`;
      });
      if (Math.abs(mx - tx) > 0.001 || Math.abs(my - ty) > 0.001) schedule();
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [rootRef]);
}
