'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useScrollReveal } from './landing/useScrollReveal';
import { useCountUp } from './landing/useCountUp';
import LandingFAQ from './landing/LandingFAQ';
import {
  IconDigest,
  IconGrind,
  IconHeat,
  IconPain,
  IconPen,
  IconQueue,
  IconScore,
  IconSoundOff,
  IconSoundOn,
  IconTimer,
  IconWin,
} from './landing/LandingIcons';

const TICKER_ITEMS = [
  '● 2,047 trends tracked in the last hour',
  '● 14M+ data points scanned today',
  '● 36h avg lead time before a trend peaks',
  '● 500+ creators shipping on the wave',
];

const MARQUEE_ITEMS = [
  { text: 'YouTube Shorts', color: '#fcefe6', italic: false },
  { text: '✦', color: '#ff5a1f', italic: false, star: true },
  { text: 'Reels', color: '#fcefe6', italic: false },
  { text: '✦', color: '#ff5a1f', italic: false, star: true },
  { text: 'TikTok', color: '#fcefe6', italic: false },
  { text: '✦', color: '#ff5a1f', italic: false, star: true },
  { text: 'LinkedIn', color: '#fcefe6', italic: false },
  { text: '✦', color: '#ff5a1f', italic: false, star: true },
  { text: 'Google Trends', color: '#fcefe6', italic: false },
  { text: '✦', color: '#ff5a1f', italic: false, star: true },
  { text: 'all in one feed', color: '#ff6b2b', italic: true },
  { text: '✦', color: '#ff5a1f', italic: false, star: true },
];

const FEATURES = [
  {
    icon: <IconScore />,
    title: 'The Nemo Score',
    desc: "Velocity + spike + cross-platform reach — blended into one number per topic. Above 70 = you're early. Above 85 = drop everything and film.",
  },
  {
    icon: <IconTimer />,
    title: 'Trend window timer',
    desc: "Every card shows the predicted hours of opportunity remaining. Past zero = you're a clone.",
  },
  {
    icon: <IconPen />,
    title: 'AI angles, ready to film',
    desc: 'One click → three platform-specific scripts. YouTube hook, Reels hot take, LinkedIn long form.',
  },
  {
    icon: <IconHeat />,
    title: 'Niche heat map',
    desc: 'See which sub-topics are heating up inside your niche before they break wide.',
  },
  {
    icon: <IconQueue />,
    title: 'Content queue',
    desc: 'Save the angles you like. Nemo keeps them sorted by window-time so you always film the most urgent first.',
  },
  {
    icon: <IconDigest />,
    title: 'Monday digest',
    desc: 'A weekly PDF of what mattered last week and what to focus on this one.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Connect & Choose Niches',
    text: 'Connect your social accounts and select up to 3 content niches. Nemo personalizes your trend feed instantly.',
  },
  {
    n: '02',
    title: 'Discover Trending Topics',
    text: 'Your dashboard shows RISING trends ranked by Nemo Score. See exactly how many hours each trend has left.',
  },
  {
    n: '03',
    title: 'Generate Angles & Post First',
    text: 'Hit ✨ Get Angles on any trend. Get 3 platform-specific content ideas in 30 seconds. Save to queue, post, go viral.',
  },
];

const HERO_POSTER = '/landing/hero-poster.webp';
const HERO_VIDEO = '/landing/hero-bg.mp4';
const HERO_VIDEO_LITE = '/landing/hero-bg-lite.mp4';

type NavigatorConnection = {
  saveData?: boolean;
  effectiveType?: string;
};

function getNetworkConnection(): NavigatorConnection | undefined {
  if (typeof window === 'undefined') return undefined;
  const nav = navigator as Navigator & {
    connection?: NavigatorConnection;
    mozConnection?: NavigatorConnection;
    webkitConnection?: NavigatorConnection;
  };
  return nav.connection || nav.mozConnection || nav.webkitConnection;
}

/** 2G / Save-Data / reduced-motion: poster only, never download video. */
function pickHeroVideoSrc(): string | null {
  if (typeof window === 'undefined') return null;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  const conn = getNetworkConnection();
  if (conn?.saveData) return null;
  if (conn?.effectiveType === 'slow-2g' || conn?.effectiveType === '2g') return null;
  if (conn?.effectiveType === '3g') return HERO_VIDEO_LITE;
  return HERO_VIDEO;
}

export default function LandingContent() {
  const rootRef = useRef<HTMLDivElement>(null);
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [heroSrc, setHeroSrc] = useState<string | null>(null);
  const [heroVideoReady, setHeroVideoReady] = useState(false);

  useScrollReveal(rootRef);
  useCountUp(rootRef);

  useEffect(() => {
    const bar = progressRef.current;
    if (!bar) return;

    const update = () => {
      const el = document.scrollingElement || document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      const pct = max > 0 ? Math.min(1, el.scrollTop / max) : 0;
      bar.style.width = `${(pct * 100).toFixed(2)}%`;
    };

    update();
    window.addEventListener('scroll', update, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', update, { capture: true });
  }, []);

  // Poster-only on 2G / Save-Data / reduced motion. One video, no src-swap.
  // Play immediately — do not wait for canplay (preload=metadata deadlocks autoplay).
  useEffect(() => {
    setHeroSrc(pickHeroVideoSrc());
  }, []);

  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video || !heroSrc) return;

    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    video.playsInline = true;
    video.loop = true;

    const hidePoster = () => {
      video.classList.add('is-playing');
      setHeroVideoReady(true);
    };

    const tryPlay = () => {
      if (!video.paused && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        hidePoster();
        return;
      }
      void video.play().catch(() => {
        /* poster stays until the playing event fires */
      });
    };

    tryPlay();
    video.addEventListener('playing', hidePoster);
    video.addEventListener('loadeddata', tryPlay);
    video.addEventListener('canplay', tryPlay);
    document.addEventListener('visibilitychange', tryPlay);

    return () => {
      video.removeEventListener('playing', hidePoster);
      video.removeEventListener('loadeddata', tryPlay);
      video.removeEventListener('canplay', tryPlay);
      document.removeEventListener('visibilitychange', tryPlay);
    };
  }, [heroSrc]);

  const toggleSound = useCallback(() => {
    const video = heroVideoRef.current;
    const next = !soundOn;
    setSoundOn(next);
    if (!video) return;
    video.muted = !next;
    video.defaultMuted = !next;
    if (next) {
      video.volume = 1;
      void video.play().catch(() => {
        /* gesture from button click should allow unmute */
      });
    }
  }, [soundOn]);

  const scrollToNextSection = useCallback(() => {
    document.querySelector('.marquee')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="landing-root" ref={rootRef}>
      <div id="world" aria-hidden="true">
        <div className="road" />
        <div className="noise" />
      </div>

      <div className="scroll-progress" ref={progressRef} aria-hidden="true" />

      <nav className="site">
        <div className="inner">
          <Link href="/" className="brand" aria-label="Nemo home" prefetch={false}>
            <Image
              className="brand-lockup"
              src="/landing/nemo-lockup.png"
              alt="Nemo"
              width={480}
              height={97}
              sizes="160px"
              priority
            />
          </Link>
          <div className="links">
            <a href="#features">Features</a>
            <a href="#how-nemo-works">How it works</a>
            <a href="#creators">Creators</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="nav-actions">
            <Link className="btn btn-ghost btn-nav" href="/login" prefetch={false}>
              Log in
            </Link>
            <Link className="btn btn-primary btn-nav" href="/signup" prefetch={false}>
              Start free
            </Link>
          </div>
        </div>
      </nav>

      <div className="ticker-shell">
        <div className="ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i}>{item}</span>
          ))}
        </div>
      </div>

      <header className="hero" id="top">
        <div className="hero-media">
          {heroSrc ? (
            <video
              ref={heroVideoRef}
              className="hero-video"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              src={heroSrc}
              aria-hidden="true"
            />
          ) : null}
          {/* Native img: next/image fill wraps a span that can cover the playing video. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={`hero-poster${heroVideoReady ? ' is-hidden' : ''}`}
            src={HERO_POSTER}
            alt=""
            aria-hidden="true"
            fetchPriority="high"
          />
          <div className="hero-media-fade-x" aria-hidden="true" />
          <div className="hero-media-fade-y" aria-hidden="true" />
          {heroSrc ? (
            <button
              type="button"
              className={`hero-sound${soundOn ? ' is-on' : ''}`}
              onClick={toggleSound}
              aria-pressed={soundOn}
              aria-label={soundOn ? 'Mute hero video' : 'Unmute hero video'}
            >
              <span className="hero-sound-icon" aria-hidden="true">
                {soundOn ? <IconSoundOn /> : <IconSoundOff />}
              </span>
              <span>{soundOn ? 'Sound off' : 'Sound on'}</span>
            </button>
          ) : null}
        </div>

        <div className="hero-veil" aria-hidden="true" />
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-inset" aria-hidden="true" />

        <div className="hero-blobs" aria-hidden="true">
          <i className="blob blob-a" />
          <i className="blob blob-b" />
          <i className="blob blob-c" />
        </div>

        <div className="hero-copy">
          <div className="hero-copy-inner">
            <div className="hero-live" aria-live="polite">
              <span className="hero-live-dot" aria-hidden="true" />
              Live · 2,047 trends tracked this hour
            </div>
            <h1>
              <span className="line">
                Catch the <span className="wave">wave.</span>
              </span>
              <span className="line">Before it crashes.</span>
            </h1>
            <p className="sub">
              Nemo tells you <b>what&apos;s blowing up</b>, on which platform, and{' '}
              <b>how many hours you have left</b> to post about it. One score. One window.
            </p>
            <div className="cta-row">
              <Link className="btn btn-primary btn-lg" href="/signup" prefetch={false}>
                Start free →
              </Link>
              <a className="btn btn-ghost btn-lg" href="#how-nemo-works">
                ▶ See how (90 sec)
              </a>
            </div>
            <p className="micro">Free forever · No card · Cancel anytime</p>
          </div>
        </div>

        <button
          type="button"
          className="hero-scroll"
          onClick={scrollToNextSection}
          aria-label="Scroll to next section"
        >
          <span className="hero-scroll-wheel" aria-hidden="true" />
          Scroll
        </button>
      </header>

      <div className="marquee">
        <div className="mq-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span
              key={i}
              className={item.star ? 'star' : item.italic ? 'it' : undefined}
              style={{ color: item.color, fontStyle: item.italic ? 'italic' : 'normal' }}
            >
              {item.text}
            </span>
          ))}
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="stat-wash" aria-hidden="true" />
          <div className="big" data-count="14" data-suffix="M+">
            0
          </div>
          <p>data points scanned daily across 5 platforms</p>
        </div>
        <div className="stat">
          <div className="stat-wash" aria-hidden="true" />
          <div className="big" data-count="3.2" data-suffix="x" data-dec="1">
            0
          </div>
          <p>faster trend detection vs manual research</p>
        </div>
        <div className="stat">
          <div className="stat-wash" aria-hidden="true" />
          <div className="big" data-count="500" data-suffix="+">
            0
          </div>
          <p>creators who already ship on the wave</p>
        </div>
        <div className="stat">
          <div className="stat-wash" aria-hidden="true" />
          <div className="big" data-count="36" data-suffix="h">
            0
          </div>
          <p>avg lead time before a trend hits the for-you-page</p>
        </div>
      </div>

      <section className="blk wrap" id="vibe">
        <div className="sec-head reveal reveal-head">
          <div className="kick-line">{'// Vibe check'}</div>
          <h2 className="display">The Creator&apos;s Biggest Problem</h2>
          <p className="vibe-sub">By the time you find a trend manually, it&apos;s already dead.</p>
        </div>

        <div className="duo">
          <div className="reveal">
            <div className="duo-card pain">
              <div className="ic-wrap" aria-hidden="true">
                <IconGrind />
              </div>
              <span className="tag">● Before</span>
              <h3>The Daily Grind</h3>
              <p>
                Open Instagram, TikTok, YouTube, Twitter, Reddit, LinkedIn, and Google Trends.
                Manually check what&apos;s trending on each. 4-5 hours gone.
              </p>
              <ul className="bullets">
                <li>7 apps, 7 logins</li>
                <li>4-5 hours every day</li>
                <li>Still miss trends</li>
              </ul>
            </div>
          </div>
          <div className="reveal">
            <div className="duo-card pain">
              <div className="ic-wrap" aria-hidden="true">
                <IconPain />
              </div>
              <span className="tag">● The pain</span>
              <h3>The Brutal Reality</h3>
              <p>
                By the time you finish your research, the trend has already peaked. You post, nobody
                cares. The creators who posted 18 hours ago got 2 million views.
              </p>
              <ul className="bullets">
                <li>Trend peaks before you post</li>
                <li>Competitors post first</li>
                <li>Hours wasted, zero ROI</li>
              </ul>
            </div>
          </div>
          <div className="reveal">
            <div className="duo-card fix">
              <div className="ic-wrap" aria-hidden="true">
                <IconWin />
              </div>
              <span className="tag">● With Nemo</span>
              <h3>First-Mover Advantage</h3>
              <p>
                Open Nemo at 9am. See your top 5 rising trends in 60 seconds. Generate 3 content
                angles in 30 seconds. Post first. Win.
              </p>
              <ul className="bullets">
                <li>3-minute morning check</li>
                <li>First to post = most views</li>
                <li>AI angles ready instantly</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="blk wrap" id="features">
        <div className="sec-head reveal reveal-head">
          <div className="kick-line">{'// Features that actually hit'}</div>
          <h2 className="display">
            Built for creators who post on <span className="it">the clock</span>, not the calendar.
          </h2>
        </div>
        <div className="feat-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="reveal">
              <div className="feat-card">
                <div className="ic">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="blk wrap" id="how-nemo-works">
        <div className="sec-head reveal reveal-head">
          <div className="kick-line">{'// How Nemo Works'}</div>
          <h2 className="display">
            From signup to <span className="it">viral content</span> in under 5 minutes.
          </h2>
        </div>
        <div className="steps-row reveal reveal-deep">
          {STEPS.map((st) => (
            <div key={st.n} className="step-cell">
              <div className="n-bg" aria-hidden="true">
                {st.n}
              </div>
              <div className="n">{st.n}</div>
              <h3>{st.title}</h3>
              <p>{st.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="blk wrap" id="creators">
        <div className="sec-head reveal reveal-head">
          <div className="kick-line">{'// Creators who ride the wave'}</div>
          <h2 className="display quote-hero">
            &quot;I went from <span className="it">1.2K</span> to <span className="hl">18K</span>{' '}
            followers in 90 days.&quot;
          </h2>
        </div>
        <div className="t-grid">
          <div className="t-card lead reveal">
            <p>
              &quot;The window timer is the <b>whole product</b>. It&apos;s the only thing that made
              me actually post on time. I just film what&apos;s red.&quot;
            </p>
            <div className="who">
              <div className="av">PS</div>
              <div>
                <b>Priya Sehgal</b>
                <span>Tech creator · 89K followers</span>
              </div>
            </div>
          </div>
          <div className="t-card std reveal">
            <p>
              &quot;Replaced 6 browser tabs with one app. My research time dropped from 3 days to 20
              minutes.&quot;
            </p>
            <div className="who">
              <div className="av">RM</div>
              <div>
                <b>Rahul Mehta</b>
                <span>Agency owner · Mumbai</span>
              </div>
            </div>
          </div>
          <div className="t-card std reveal">
            <div className="big-stat">3.2x</div>
            <p>avg increase in views per post within 30 days of using Nemo.</p>
          </div>
        </div>
      </section>

      <section className="blk wrap" id="faq">
        <div className="sec-head reveal reveal-head">
          <div className="kick-line">{'// Questions we get a lot'}</div>
          <h2 className="display">FAQ.</h2>
        </div>
        <div className="faq-layout">
          <LandingFAQ />
          <aside className="faq-mascot reveal">
            <div className="faq-mascot-glow" aria-hidden="true" />
            <div className="faq-mascot-art">
              <Image
                src="/landing/nemo-faq.png"
                alt="Nemo the mascot relaxing in a beanbag with a laptop"
                width={780}
                height={696}
                sizes="(max-width: 768px) 200px, 260px"
                loading="lazy"
              />
            </div>
            <div className="faq-mascot-copy">
              <h3>
                Still have questions?
                <br />
                <span>We&apos;ve got you.</span>
              </h3>
              <Link className="btn btn-primary btn-mascot" href="/signup" prefetch={false}>
                Start free →
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="final wrap">
        <div className="final-inner reveal reveal-head">
          <h2>
            Stop posting <span className="it">last week&apos;s</span> trend.
            <br />
            Start posting <span className="it final-tomorrow">tomorrow&apos;s.</span>
          </h2>
          <p>Two minutes to set up. Free forever. Your future-self will thank you.</p>
          <div className="cta-row">
            <Link className="btn btn-primary btn-lg" href="/signup" prefetch={false}>
              Catch the wave →
            </Link>
            <a className="btn btn-ghost btn-lg" href="#features">
              Explore features
            </a>
          </div>
        </div>
      </section>

      <div className="foot-marquee" aria-hidden="true">
        <div className="track">
          <Image
            src="/landing/nemo-wordmark.png"
            alt=""
            width={1160}
            height={300}
            sizes="(max-width: 768px) 320px, 580px"
            loading="lazy"
            aria-hidden
          />
          <Image
            src="/landing/nemo-wordmark.png"
            alt=""
            width={1160}
            height={300}
            sizes="(max-width: 768px) 320px, 580px"
            loading="lazy"
            aria-hidden
          />
          <Image
            src="/landing/nemo-wordmark.png"
            alt=""
            width={1160}
            height={300}
            sizes="(max-width: 768px) 320px, 580px"
            loading="lazy"
            aria-hidden
          />
          <Image
            src="/landing/nemo-wordmark.png"
            alt=""
            width={1160}
            height={300}
            sizes="(max-width: 768px) 320px, 580px"
            loading="lazy"
            aria-hidden
          />
        </div>
      </div>

      <footer className="site">
        <div className="foot-inner">
          <div className="top">
            <div className="foot-brand-block">
              <Link href="/" aria-label="Nemo home" prefetch={false}>
                <Image
                  className="brand-lockup"
                  src="/landing/nemo-lockup.png"
                  alt="Nemo"
                  width={480}
                  height={97}
                  sizes="140px"
                  loading="lazy"
                />
              </Link>
              <p>
                Real-time trend detection for creators and marketers who refuse to show up late.
              </p>
            </div>
            <div className="cols">
              <div className="col">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#how-nemo-works">How it works</a>
                <Link href="/signup">Sign up</Link>
                <Link href="/login">Log in</Link>
              </div>
              <div className="col">
                <h4>Resources</h4>
                <a href="#faq">FAQ</a>
                <a href="#creators">Creators</a>
                <a href="#features">Features</a>
              </div>
              <div className="col">
                <h4>Legal</h4>
                <Link href="/privacy">Privacy</Link>
                <Link href="/terms">Terms</Link>
                <Link href="/refunds">Refunds</Link>
              </div>
            </div>
          </div>
          <div className="bottom">
            <span>© 2026 Nemo. All rights reserved.</span>
            <span>Your content. Everywhere.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
