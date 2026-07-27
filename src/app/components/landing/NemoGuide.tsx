'use client';

import React, { useEffect, useRef, useState } from 'react';

const STOPS = [
  { sel: '.hero', text: "Hey! I'm <b>Nemo</b> 🐾 Follow me — I'll walk you through how to catch trends before they blow up." },
  { sel: '.stats', text: "First stop: I sniff through <b>14M+ signals</b> a day across 5 platforms so you don't have to." },
  { sel: '#vibe', text: "Six tabs open and still no idea what to post? Been there. Let's fix that. 🐕" },
  { sel: '#features', text: "Here's my toolkit — a trend <b>Score</b>, a window <b>timer</b>, and ready-to-film <b>angles</b>!" },
  { sel: '#how-nemo-works', text: 'Three easy steps: pick your niche, open the dashboard, then generate &amp; ship. Fetch! 🎾' },
  { sel: '#creators', text: "My friends went from <b>1.2K to 18K</b> followers. Good dog moves. You're next!" },
  { sel: '#faq', text: "Got questions? Sniff around here — I've buried all the answers. 🦴" },
  { sel: '.final', text: "That's the tour! Ready to ride the wave with me? Let's goooo! 🌊" },
];

export default function NemoGuide({ rootRef }: { rootRef: React.RefObject<HTMLElement | null> }) {
  const [open, setOpen] = useState(false);
  const [userPref, setUserPref] = useState<boolean | null>(null);
  const [current, setCurrent] = useState(0);
  const [textOpacity, setTextOpacity] = useState(1);
  const dogRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<Array<{ sel: string; text: string; el: Element | null }>>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    nodesRef.current = STOPS.map((s) => ({
      ...s,
      el: root.querySelector(s.sel),
    })).filter((s) => s.el);

    const show = (i: number) => {
      if (i < 0 || i >= nodesRef.current.length) return;
      setCurrent(i);
      if (userPref === null) {
        setOpen(i !== 0);
      }
      setTextOpacity(0);
      setTimeout(() => {
        setTextOpacity(1);
        dogRef.current?.classList.remove('speak');
        void dogRef.current?.offsetWidth;
        dogRef.current?.classList.add('speak');
      }, 180);
    };

    const obs = new IntersectionObserver(
      (entries) => {
        let best: Element | null = null;
        let bestRatio = 0;
        entries.forEach((e) => {
          if (e.intersectionRatio > bestRatio) {
            bestRatio = e.intersectionRatio;
            best = e.target;
          }
        });
        if (best) {
          const idx = nodesRef.current.findIndex((n) => n.el === best);
          if (idx >= 0 && bestRatio > 0.25) show(idx);
        }
      },
      { threshold: [0.25, 0.5, 0.75] }
    );

    nodesRef.current.forEach((n) => {
      if (n.el) obs.observe(n.el);
    });

    show(0);
    return () => obs.disconnect();
  }, [rootRef, userPref]);

  const isOpen = userPref !== null ? userPref : open;

  const handleDogClick = () => {
    const nodes = nodesRef.current;
    const next = Math.min(current + 1, nodes.length - 1);
    const el = nodes[next]?.el;
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 70;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  const handleToggle = () => {
    const next = !isOpen;
    setUserPref(next);
  };

  const stop = STOPS[current] ?? STOPS[0];

  return (
    <div className="nemo-guide" data-open={isOpen ? 'true' : 'false'}>
      <button type="button" className="nemo-toggle" aria-label="Toggle Nemo guide" onClick={handleToggle}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            d="M7 10c0-2 2-4 5-4s5 2 5 4M5 13a1.6 1.6 0 1 1 0-.01M19 13a1.6 1.6 0 1 1 0-.01M9.5 10.5a1.4 1.4 0 1 1 0-.01M14.5 10.5a1.4 1.4 0 1 1 0-.01M12 12c1.7 0 3 1.2 3 2.7 0 1.4-1.3 2.3-3 2.3s-3-.9-3-2.3C9 13.2 10.3 12 12 12Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <div className="nemo-panel">
        <div className="nemo-bubble">
          <span className="nemo-stop">
            Stop {current + 1} of {STOPS.length}
          </span>
          <p style={{ opacity: textOpacity }} dangerouslySetInnerHTML={{ __html: stop.text }} />
          <div className="nemo-bubble-tail" />
        </div>

        <div className="nemo-dog" ref={dogRef} onClick={handleDogClick} onKeyDown={(e) => e.key === 'Enter' && handleDogClick()} role="button" tabIndex={0}>
          <svg viewBox="0 0 200 210" width="118" height="124" aria-label="Nemo the beagle">
            <defs>
              <linearGradient id="collarG" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#FF3D0D" />
                <stop offset="1" stopColor="#FF8A22" />
              </linearGradient>
            </defs>
            <g className="nemo-tail">
              <path d="M150 150 q40 -6 44 -40 q-2 34 -30 50 z" fill="#7A4A24" />
            </g>
            <ellipse cx="100" cy="156" rx="60" ry="48" fill="#C68A4E" />
            <ellipse cx="100" cy="168" rx="36" ry="38" fill="#FBF4EC" />
            <rect x="78" y="150" width="18" height="52" rx="9" fill="#FBF4EC" />
            <rect x="104" y="150" width="18" height="52" rx="9" fill="#FBF4EC" />
            <ellipse cx="87" cy="200" rx="11" ry="7" fill="#EADBCB" />
            <ellipse cx="113" cy="200" rx="11" ry="7" fill="#EADBCB" />
            <g className="nemo-head">
              <ellipse cx="54" cy="96" rx="17" ry="42" fill="#7A4A24" transform="rotate(-14 54 96)" />
              <ellipse cx="146" cy="96" rx="17" ry="42" fill="#7A4A24" transform="rotate(14 146 96)" />
              <ellipse cx="100" cy="82" rx="52" ry="46" fill="#FBF4EC" />
              <path d="M52 74 q6 -44 48 -44 q42 0 48 44 q-24 -14 -48 -14 q-24 0 -48 14 z" fill="#C68A4E" />
              <ellipse cx="78" cy="80" rx="15" ry="16" fill="#C68A4E" opacity="0.55" />
              <ellipse cx="122" cy="80" rx="15" ry="16" fill="#C68A4E" opacity="0.55" />
              <ellipse cx="100" cy="104" rx="30" ry="24" fill="#FBF4EC" />
              <g className="nemo-eyes">
                <ellipse cx="80" cy="82" rx="7" ry="8" fill="#241914" />
                <ellipse cx="120" cy="82" rx="7" ry="8" fill="#241914" />
                <circle cx="82.5" cy="79" r="2.2" fill="#fff" />
                <circle cx="122.5" cy="79" r="2.2" fill="#fff" />
              </g>
              <ellipse cx="100" cy="98" rx="9" ry="7" fill="#241914" />
              <path d="M100 105 q0 8 -9 10 M100 105 q0 8 9 10" stroke="#241914" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            </g>
            <path d="M66 128 q34 20 68 0" stroke="url(#collarG)" strokeWidth="12" fill="none" strokeLinecap="round" />
            <circle cx="100" cy="140" r="12" fill="#FFD27A" />
            <text x="100" y="145" textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize="15" fill="#7A4A24">
              N
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
