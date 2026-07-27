'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { useScrollReveal } from './landing/useScrollReveal';
import { useCountUp } from './landing/useCountUp';
import { useHeroParallax } from './landing/useHeroParallax';
import { useTravelingGlow } from './landing/useTravelingGlow';
import LandingFAQ from './landing/LandingFAQ';
import NemoGuide from './landing/NemoGuide';

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
  { ic: '87', title: 'The Nemo Score', desc: "Velocity + spike + cross-platform reach — blended into one number per topic. Above 70 = you're early. Above 85 = drop everything and film." },
  { ic: '⏳', title: 'Trend window timer', desc: "Every card shows the predicted hours of opportunity remaining. Past zero = you're a clone." },
  { ic: '✎', title: 'AI angles, ready to film', desc: 'One click → three platform-specific scripts. YouTube hook, Reels hot take, LinkedIn long form.' },
  { ic: '▦', title: 'Niche heat map', desc: 'See which sub-topics are heating up inside your niche before they break wide.' },
  { ic: '≡', title: 'Content queue', desc: 'Save the angles you like. Nemo keeps them sorted by window-time so you always film the most urgent first.' },
  { ic: '↻', title: 'Monday digest', desc: 'A weekly PDF of what mattered last week and what to focus on this one.' },
];

export default function LandingContent() {
  const rootRef = useRef<HTMLDivElement>(null);

  useScrollReveal(rootRef);
  useCountUp(rootRef);
  useHeroParallax(rootRef);
  useTravelingGlow(rootRef);

  return (
    <div className="landing-root" ref={rootRef}>
      <div id="world" aria-hidden="true">
        <div className="travel-glow" />
        <div className="road" />
      </div>

      <nav className="site">
        <div className="inner">
          <Link href="/" className="brand">
            <div className="nx-mark">
              <span>N</span>
            </div>
            <div className="nx-word">
              Nemo<span className="nx-dot">.</span>
            </div>
          </Link>
          <div className="links">
            <a href="#features">Features</a>
            <a href="#how-nemo-works">How it works</a>
            <a href="#creators">Creators</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="right">
            <Link className="btn btn-ghost btn-sm" href="/login" style={{ color: '#FCEFE6' }}>
              Log in
            </Link>
            <Link className="btn btn-primary btn-sm" href="/signup">
              Start free
            </Link>
          </div>
        </div>
      </nav>

      <div className="wrap">
        <div className="ticker">
          <div className="ticker-track">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i}>{item}</span>
            ))}
          </div>
        </div>
      </div>

      <header className="hero wrap">
        <div className="hero-aurora" data-parallax="0.05">
          <i className="a1" />
          <i className="a2" />
          <i className="a3" />
        </div>
        <div className="hero-grain" />
        <div className="hero-veil" />

        <div className="hero-platforms" data-parallax="0.06" aria-hidden="true">
          <svg className="p1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M16 8.5v6a4.5 4.5 0 1 1-4.5-4.5" />
            <path d="M16 3v5.5a5 5 0 0 0 5 5" />
          </svg>
          <svg className="p2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4.2" />
            <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
          </svg>
          <svg className="p3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <rect x="2.5" y="5" width="19" height="14" rx="3.5" />
            <path d="M10 9.2v5.6l5-2.8-5-2.8Z" fill="currentColor" stroke="none" />
          </svg>
          <svg className="p4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8" cy="8.2" r="1.6" fill="currentColor" stroke="none" />
            <path d="M6.5 11v6.5M6.5 11h0" />
            <path d="M11.5 11v6.5M11.5 13.4c0-2 3-3.4 4.7-1.8.7.6.8 1.5.8 2.4v3.5" />
          </svg>
          <svg className="p5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M4 15c3-6 6-9 8-9s5 3 8 9" />
            <path d="M8 14.5c1.5-3 2.6-4.4 4-4.4s2.5 1.4 4 4.4" />
          </svg>
        </div>

        <div className="hero-content">
          <span className="hero-eyebrow">
            <span className="live" /> Live · 2,047 trends tracked this hour
          </span>
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
              Nemo tells you <b>what&apos;s blowing up</b>, on which platform, and <b>how many hours you have left</b> to post about it. One score. One window.
            </p>
            <div className="cta-row">
              <Link className="btn btn-primary btn-lg" href="/signup">
                Start free →
              </Link>
              <a className="btn btn-ghost btn-lg" href="#how-nemo-works" style={{ color: '#FCEFE6' }}>
                ▶ See how (90 sec)
              </a>
            </div>
            <div className="micro">Free forever · No card · Cancel anytime</div>
          </div>
        </div>

        <div className="scroll-cue">
          <div className="mouse" />
          <span>Scroll</span>
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
        <div className="kick-line reveal">// Vibe check</div>
        <h2 className="display reveal">The Creator&apos;s Biggest Problem</h2>
        <p className="reveal vibe-sub">By the time you find a trend manually, it&apos;s already dead.</p>

        <div className="duo">
          <div className="duo-card pain reveal">
            <div className="emoji">😩</div>
            <span className="tag">● Before</span>
            <h3>The Daily Grind</h3>
            <p>Open Instagram, TikTok, YouTube, Twitter, Reddit, LinkedIn, and Google Trends. Manually check what&apos;s trending on each. 4-5 hours gone.</p>
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
            <p>By the time you finish your research, the trend has already peaked. You post, nobody cares. The creators who posted 18 hours ago got 2 million views.</p>
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
            <p>Open Nemo at 9am. See your top 5 rising trends in 60 seconds. Generate 3 content angles in 30 seconds. Post first. Win.</p>
            <ul className="bullets">
              <li>3-minute morning check</li>
              <li>First to post = most views</li>
              <li>AI angles ready instantly</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="blk wrap" id="features">
        <div className="kick-line reveal">// Features that actually hit</div>
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
        <div className="kick-line reveal">// How Nemo Works</div>
        <h2 className="display reveal">
          From signup to <span className="it">viral content</span> in under 5 minutes.
        </h2>
        <div className="steps-row reveal">
          <div className="step-cell">
            <div className="n">01</div>
            <h3>Connect &amp; Choose Niches</h3>
            <p>Connect your social accounts and select up to 3 content niches. Nemo personalizes your trend feed instantly.</p>
          </div>
          <div className="step-cell">
            <div className="n">02</div>
            <h3>Discover Trending Topics</h3>
            <p>Your dashboard shows RISING trends ranked by Nemo Score. See exactly how many hours each trend has left.</p>
          </div>
          <div className="step-cell">
            <div className="n">03</div>
            <h3>Generate Angles &amp; Post First</h3>
            <p>Hit ✨ Get Angles on any trend. Get 3 platform-specific content ideas in 30 seconds. Save to queue, post, go viral.</p>
          </div>
        </div>
      </section>

      <section className="blk wrap" id="creators">
        <div className="kick-line reveal">// Creators who ride the wave</div>
        <div className="quote-hero reveal">
          &quot;I went from <span className="it">1.2K</span> to <span className="hl">18K</span> followers in 90 days.&quot;
        </div>
        <div className="t-grid">
          <div className="t-card lead reveal">
            <p>
              &quot;The window timer is the <b>whole product</b>. It&apos;s the only thing that made me actually post on time. I just film what&apos;s red.&quot;
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
            <p>&quot;Replaced 6 browser tabs with one app. My research time dropped from 3 days to 20 minutes.&quot;</p>
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
            <p style={{ marginTop: 10 }}>avg increase in views per post within 30 days of using Nemo.</p>
          </div>
        </div>
      </section>

      <section className="blk wrap" id="faq">
        <div className="kick-line reveal">// Questions we get a lot</div>
        <h2 className="display reveal">FAQ.</h2>
        <LandingFAQ />
      </section>

      <section className="final wrap">
        <h2 className="reveal">
          Stop posting <span className="it">last week&apos;s</span> trend.
          <br />
          Start posting <span className="it final-tomorrow">tomorrow&apos;s.</span>
        </h2>
        <p className="reveal">Two minutes to set up. Free forever. Your future-self will thank you.</p>
        <div className="cta-row reveal">
          <Link className="btn btn-primary btn-lg" href="/signup">
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
                <a href="#">Privacy</a>
                <a href="#">Terms</a>
                <a href="#">Refunds</a>
              </div>
            </div>
          </div>
          <div className="bottom">
            <span>© 2026 Nemo. All rights reserved.</span>
            <span>Your content. Everywhere.</span>
          </div>
        </div>
      </footer>

      <NemoGuide rootRef={rootRef} />
    </div>
  );
}
