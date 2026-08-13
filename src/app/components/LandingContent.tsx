'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useScrollReveal } from './landing/useScrollReveal';
import { useCountUp } from './landing/useCountUp';
import { useHeroParallax } from './landing/useHeroParallax';
import { useTravelingGlow } from './landing/useTravelingGlow';
import LandingFAQ from './landing/LandingFAQ';

const TICKER_ITEMS = [
  '● 2,047 trends tracked in the last hour',
  '● 14M+ data points scanned today',
  '● 36h avg lead time before a trend peaks',
  '● 500+ creators shipping on the wave',
];

const MARQUEE_ITEMS = [
  { text: 'YouTube Shorts', italic: false },
  { text: '✦', star: true },
  { text: 'Reels', italic: true },
  { text: '✦', star: true },
  { text: 'TikTok', italic: false },
  { text: '✦', star: true },
  { text: 'LinkedIn', italic: true },
  { text: '✦', star: true },
  { text: 'Google Trends', italic: false },
  { text: '✦', star: true },
  { text: 'all in one feed', italic: true },
  { text: '✦', star: true },
];

const FEATURES = [
  {
    ic: '87',
    title: 'The Nemo Score',
    desc: "Velocity + spike + cross-platform reach — blended into one number per topic. Above 70 = you're early. Above 85 = drop everything and film.",
  },
  {
    ic: '⏳',
    title: 'Trend window timer',
    desc: "Every card shows the predicted hours of opportunity remaining. Past zero = you're a clone.",
  },
  {
    ic: '✎',
    title: 'AI angles, ready to film',
    desc: 'One click → three platform-specific scripts. YouTube hook, Reels hot take, LinkedIn long form.',
  },
  {
    ic: '▦',
    title: 'Niche heat map',
    desc: 'See which sub-topics are heating up inside your niche before they break wide.',
  },
  {
    ic: '≡',
    title: 'Content queue',
    desc: 'Save the angles you like. Nemo keeps them sorted by window-time so you always film the most urgent first.',
  },
  {
    ic: '↻',
    title: 'Monday digest',
    desc: 'A weekly PDF of what mattered last week and what to focus on this one.',
  },
];

export default function LandingContent() {
  const rootRef = useRef<HTMLDivElement>(null);
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const [soundOn, setSoundOn] = useState(false);

  useScrollReveal(rootRef);
  useCountUp(rootRef);
  useHeroParallax(rootRef);
  useTravelingGlow(rootRef);

  // Browsers block unmuted autoplay — start muted, then enable audio on user gesture.
  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;
    video.muted = !soundOn;
    video.defaultMuted = !soundOn;
    const play = () => {
      void video.play().catch(() => {
        /* ignore until gesture */
      });
    };
    play();
    video.addEventListener('loadeddata', play);
    return () => video.removeEventListener('loadeddata', play);
  }, [soundOn]);

  const toggleSound = useCallback(() => {
    const video = heroVideoRef.current;
    const next = !soundOn;
    setSoundOn(next);
    if (!video) return;
    video.muted = !next;
    if (next) {
      video.volume = 1;
      void video.play().catch(() => {
        /* still blocked — keep UI state; user can retry */
      });
    }
  }, [soundOn]);

  return (
    <div className="landing-root" ref={rootRef}>
      <div id="world" aria-hidden="true">
        <div className="travel-glow" />
        <div className="road" />
      </div>

      <nav className="site">
        <div className="inner">
          <div className="nav-actions">
            <Link
              className="btn btn-ghost btn-nav"
              href="/login"
              style={{ color: '#FCEFE6' }}
              prefetch={false}
            >
              Log in
            </Link>
            <Link className="btn btn-primary btn-nav" href="/signup" prefetch={false}>
              Start free
            </Link>
          </div>
          <div className="links">
            <a href="#features">Features</a>
            <a href="#how-nemo-works">How it works</a>
            <a href="#creators">Creators</a>
            <a href="#faq">FAQ</a>
          </div>
          <Link href="/" className="brand">
            <div className="nx-mark">
              <span>N</span>
            </div>
            <div className="nx-word">
              Nemo<span className="nx-dot">.</span>
            </div>
          </Link>
        </div>
      </nav>

      {/* Full-bleed ticker — not inside .wrap */}
      <div className="ticker-shell">
        <div className="ticker">
          <div className="ticker-track">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i}>{item}</span>
            ))}
          </div>
        </div>
      </div>

      <header className="hero">
        <div className="hero-copy">
          <div className="hero-copy-inner">
            <div className="hero-live" aria-live="polite">
              <span className="hero-live-dot" aria-hidden="true" />
              <span className="hero-live-label">LIVE</span>
              <span className="hero-live-sep" aria-hidden="true">
                ·
              </span>
              <span className="hero-live-meta">2,047 trends tracked this hour</span>
            </div>
            <h1>
              <span className="line">
                <span>
                  Catch the <span className="wave">wave.</span>
                </span>
              </span>
              <span className="line">
                <span>Before it crashes.</span>
              </span>
            </h1>
            <div className="hero-lower">
              <p className="sub">
                Nemo tells you <b>what&apos;s blowing up</b>, on which platform, and{' '}
                <b>how many hours you have left</b> to post about it.
                <br />
                One score. One window.
              </p>
              <div className="cta-row">
                <Link className="btn btn-primary btn-lg" href="/signup" prefetch={false}>
                  Start free →
                </Link>
                <a
                  className="btn btn-ghost btn-lg"
                  href="#how-nemo-works"
                  style={{ color: '#FCEFE6' }}
                >
                  ▶ See how (90 sec)
                </a>
              </div>
              <div className="micro">Free forever · No card · Cancel anytime</div>
            </div>
          </div>
        </div>

        <div className="hero-media">
          <video
            ref={heroVideoRef}
            className="hero-video"
            autoPlay
            muted={!soundOn}
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
          >
            <source src="/Initial_Scene_-_2026-08-13_202608140019.mp4" type="video/mp4" />
          </video>
          <div className="hero-media-blend" aria-hidden="true" />
          <button
            type="button"
            className={`hero-sound${soundOn ? ' is-on' : ''}`}
            onClick={toggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? 'Mute hero video' : 'Unmute hero video'}
          >
            {soundOn ? 'Mute' : 'Sound on'}
          </button>
        </div>
      </header>

      <div className="marquee">
        <div className="mq-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className={item.star ? 'star' : item.italic ? 'it' : undefined}>
              {item.text}
            </span>
          ))}
        </div>
      </div>

      <div className="stats">
        <div className="stat reveal">
          <div className="big" data-count="14" data-suffix="M+">
            0
          </div>
          <p>data points scanned daily across 5 platforms</p>
        </div>
        <div className="stat reveal">
          <div className="big" data-count="3.2" data-suffix="x" data-dec="1">
            0
          </div>
          <p>faster trend detection vs manual research</p>
        </div>
        <div className="stat reveal">
          <div className="big" data-count="500" data-suffix="+">
            0
          </div>
          <p>creators who already ship on the wave</p>
        </div>
        <div className="stat reveal">
          <div className="big" data-count="36" data-suffix="h">
            0
          </div>
          <p>avg lead time before a trend hits the for-you-page</p>
        </div>
      </div>

      <section className="blk wrap" id="vibe">
        <div className="kick-line reveal">{'// Vibe check'}</div>
        <h2 className="display reveal">The Creator&apos;s Biggest Problem</h2>
        <p className="reveal vibe-sub">
          By the time you find a trend manually, it&apos;s already dead.
        </p>

        <div className="duo">
          <div className="duo-card pain reveal">
            <div className="emoji">😩</div>
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
          <div className="duo-card pain reveal">
            <div className="emoji">😱</div>
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
          <div className="duo-card fix reveal">
            <div className="emoji">🚀</div>
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
      </section>

      <section className="blk wrap" id="features">
        <div className="kick-line reveal">{'// Features that actually hit'}</div>
        <h2 className="display reveal">
          Built for creators who post on <span className="it">the clock</span>, not the calendar.
        </h2>
        <div className="feat-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feat-card reveal">
              <div className="ic">{f.ic}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="blk wrap" id="how-nemo-works">
        <div className="kick-line reveal">{'// How Nemo Works'}</div>
        <h2 className="display reveal">
          From signup to <span className="it">viral content</span> in under 5 minutes.
        </h2>
        <div className="steps-row reveal">
          <div className="step-cell">
            <div className="n">01</div>
            <h3>Connect &amp; Choose Niches</h3>
            <p>
              Connect your social accounts and select up to 3 content niches. Nemo personalizes your
              trend feed instantly.
            </p>
          </div>
          <div className="step-cell">
            <div className="n">02</div>
            <h3>Discover Trending Topics</h3>
            <p>
              Your dashboard shows RISING trends ranked by Nemo Score. See exactly how many hours
              each trend has left.
            </p>
          </div>
          <div className="step-cell">
            <div className="n">03</div>
            <h3>Generate Angles &amp; Post First</h3>
            <p>
              Hit ✨ Get Angles on any trend. Get 3 platform-specific content ideas in 30 seconds.
              Save to queue, post, go viral.
            </p>
          </div>
        </div>
      </section>

      <section className="blk wrap" id="creators">
        <div className="kick-line reveal">{'// Creators who ride the wave'}</div>
        <div className="quote-hero reveal">
          &quot;I went from <span className="it">1.2K</span> to <span className="hl">18K</span>{' '}
          followers in 90 days.&quot;
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
            <p style={{ marginTop: 10 }}>
              avg increase in views per post within 30 days of using Nemo.
            </p>
          </div>
        </div>
      </section>

      <section className="blk wrap" id="faq">
        <div className="kick-line reveal">{'// Questions we get a lot'}</div>
        <h2 className="display reveal">FAQ.</h2>
        <LandingFAQ />
      </section>

      <section className="final wrap">
        <h2 className="reveal">
          Stop posting <span className="it">last week&apos;s</span> trend.
          <br />
          Start posting <span className="it final-tomorrow">tomorrow&apos;s.</span>
        </h2>
        <p className="reveal">
          Two minutes to set up. Free forever. Your future-self will thank you.
        </p>
        <div className="cta-row reveal">
          <Link className="btn btn-primary btn-lg" href="/signup" prefetch={false}>
            Catch the wave →
          </Link>
          <a className="btn btn-ghost btn-lg" href="#features" style={{ color: '#FCEFE6' }}>
            Explore features
          </a>
        </div>
      </section>

      <div className="foot-marquee">
        <div className="track">
          <span>NEMO.&nbsp;NEMO.&nbsp;NEMO.&nbsp;NEMO.&nbsp;</span>
          <span>NEMO.&nbsp;NEMO.&nbsp;NEMO.&nbsp;NEMO.&nbsp;</span>
        </div>
      </div>

      <footer className="site">
        <div className="wrap">
          <div className="top">
            <div style={{ maxWidth: 280 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="nx-mark" style={{ width: 34, fontSize: 20 }}>
                  <span>N</span>
                </div>
                <span className="nx-word" style={{ fontSize: 20, color: '#FCEFE6' }}>
                  Nemo<span className="nx-dot">.</span>
                </span>
              </div>
              <p style={{ color: '#97806F', fontSize: '0.9rem', marginTop: 14, lineHeight: 1.6 }}>
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
                <a href="#">Blog</a>
                <a href="#creators">Creators</a>
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
