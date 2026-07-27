# NEMO — Catch Every Trend Before It Peaks

Multi-platform trend intelligence and content creation for creators, marketers, and agencies.

Nemo detects emerging topics across Google Trends, YouTube, Instagram, TikTok, Twitter/X, Reddit, and LinkedIn, ranks them with a composite **Nemo Score**, and helps you act with AI angles, viral scripts, carousel studio, queue, analytics, and reports.

This project is developed and maintained in **Cursor** as a Next.js 15 / React 19 / TypeScript / Tailwind application.

## Features

- Live trend dashboard, explore, and trend detail with Nemo Score breakdown
- Content queue, carousel studio, viral script writer, and saved scripts
- Analytics and weekly reports with plan-based gating
- Auth, onboarding, settings, pricing, and checkout flows
- AI chat and script generation via OpenAI / Anthropic / Gemini / Perplexity
- Supabase-ready auth + trend schema (graceful local fallback when env is unset)
- MVP collectors for Google Trends, YouTube, and Reddit with scoring engine

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables and fill in keys as needed (`.env`):

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — auth & DB (optional; local fallback works)
- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` / `PERPLEXITY_API_KEY` — AI providers
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `NEXT_PUBLIC_RAZORPAY_KEY_ID` — checkout
- `YOUTUBE_API_KEY` — optional YouTube Data API for live collectors

3. Apply Supabase schema (when using Supabase):

```bash
# Run the SQL in supabase/migrations/001_nemo_schema.sql in the Supabase SQL editor
```

4. Start the development server:

```bash
npm run dev
```

Open [http://localhost:4028](http://localhost:4028).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server on port 4028 |
| `npm run build` | Production build |
| `npm run serve` | Production server |
| `npm run type-check` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Architecture notes

- **Signals & scoring:** `src/lib/signals/` — platform signal types, collectors, Nemo Score formulas
- **Trends API:** `GET/POST /api/trends` — scored trends from collectors or store
- **AI:** `POST /api/ai/chat-completion` — provider-agnostic OpenAI-compatible proxy
- **Billing:** Razorpay order/verify APIs + plan usage counters

## License

Private — All rights reserved.
