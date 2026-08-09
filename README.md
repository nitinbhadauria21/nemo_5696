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
# Apply SQL migrations in order (001 → 010) via Supabase SQL Editor or CLI
# Files live in supabase/migrations/
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

## PM skills (Cursor Agent)

Nemo uses a curated subset of [phuryn/pm-skills](https://github.com/phuryn/pm-skills) for product management workflows in Cursor. The project index is at [.cursor/skills/nemo-pm-skills/SKILL.md](.cursor/skills/nemo-pm-skills/SKILL.md); the full library (111 skills) is installed globally in `~/.cursor/skills/`.

Ask in natural language — Cursor loads the matching skill automatically:

| When you need to… | Example prompt |
|-------------------|----------------|
| Prioritize MVP backlog | "Triage our MVP backlog using MoSCoW" |
| Spec a feature | "Write a PRD for the onboarding wizard" or "Write a PRD for trend snapshot pipeline" |
| Break work into stories | "Break onboarding into user stories" |
| Validate assumptions | "What are our riskiest assumptions about mandatory social connect?" |
| Define launch metrics | "Pick a North Star metric and input metrics for Nemo" |
| Review before prod | "Run ship-check on auth and billing routes" |
| Security audit | "Audit OAuth tokens, Razorpay webhook, and Supabase RLS" |
| Pricing / tiers | "Validate Free/Pro/Agency pricing and AI angle limits" |
| Positioning / landing | "Write positioning lines for the landing page hero" |
| Plan launch | "Plan launch for pricing page, onboarding, and Pro upgrade path" |
| Gap analysis | "Compare scoring spec to what's built in src/lib/signals/" |

Gap-to-skill mapping (onboarding, OAuth, collectors, gating, snapshots) is in the [nemo-pm-skills index](.cursor/skills/nemo-pm-skills/SKILL.md#audit-gap-mapping).

## License

Private — All rights reserved.
