'use client';

import React, { useState } from 'react';

const FAQ_ITEMS = [
  {
    q: 'Is this just another trend tool?',
    a: 'Most "trend tools" show you what\'s already exploded — by then you\'re late. Nemo predicts trends 24–48 hours before they peak using a composite score across 5 platforms. The window timer is the unfair advantage.',
  },
  {
    q: 'Do I need a credit card to start?',
    a: 'No. Start free, stay free. No card, no trial countdown, no surprise charges.',
  },
  {
    q: 'Which platforms are covered?',
    a: 'YouTube Shorts, Instagram Reels, TikTok, LinkedIn and Google Trends — merged into one feed, one score.',
  },
  {
    q: 'How accurate are the predictions?',
    a: "The Nemo Score is right about the 36-hour window roughly 8 times out of 10 — and it keeps learning from every trend cycle. You'll always see the source signals behind the number, so you can judge for yourself.",
  },
  {
    q: 'Can I export everything?',
    a: 'Yes — angles, queues and digests export to PDF and CSV. Your data stays yours.',
  },
  {
    q: "What if I don't like it?",
    a: 'Delete your account in two clicks, no email chains, no "are you sure" guilt trips. But the free tier means you can just… keep it.',
  },
];

export default function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState(-1);

  return (
    <div className="faq-list">
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.q} className={`faq-item${isOpen ? ' open' : ''}`}>
            <button
              type="button"
              className="faq-q"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? -1 : i)}
            >
              <h3>{item.q}</h3>
              <span className="plus">+</span>
            </button>
            <div className="faq-a">
              <p>{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
