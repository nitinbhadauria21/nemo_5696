# Nemo Debug Report — 2026-08-12

## 1. Executive Summary

Nemo is a **Next.js 15 App Router** app on Vercel (`nemo-5696`) with **Supabase Postgres** (`tynyuntaebfqfnbyekxa`). Production serves **live** trend rows (`source=live`), not silent mock data. GHA 30‑minute ingest is succeeding; the last successful collector run finished `2026-08-12T05:11:03Z` with 55 trends. The owner symptoms are real but mostly **not** “filters ignored / no DB”: (1) **24h/48h/72h return identical feeds** because the window uses `latestActivityAt`←`last_seen_at`, and every ingest bumps `last_seen_at` so **352/352** rows look ≤24h; (2) **draft filters only apply on Submit**, so chip clicks alone look broken; (3) **niche accuracy is poor** because `classifyTrendNiche` **defaults unmatched text to `AI`** (`publicCopy.ts:131`), and **311/352** DB niches are `AI`. Demo verdict before fixes: **READY WITH KNOWN LIMITATIONS** (closest template label: **READY WITH DEMO DATA** for honesty on niche quality — data is live, but AI niche is polluted). After P0 fixes in §9: re-verify primary path.

## 2. What Is Working

- Production deploy READY on commit `b1b8b4c` / prior Phase B `3220ce9` (`vercel ls`, MCP `list_deployments`).
- Local `npm run build` **succeeds** (Next.js compile complete; exit 0).
- Supabase connectivity local: `scripts/verify-supabase.mjs` → Anon OK + service-role table checks OK.
- Public `/api/trends` returns `source=live`, `totalBeforeFilter=200`, `collectedAt=2026-08-12T05:11:03.284+00:00`.
- Niche filter **does** change results when applied: `niche=fitness&timeframe=24h` → **3** cards vs AI → **40**.
- Platform filter **does** work with correct param `platforms=youtube` → only `youtube` / `youtube_shorts`.
- `/api/data-sources/status` returns honest Live/Partial/Unavailable labels; `demo:false`.
- Admin routes reject unauthenticated access: `/api/admin/health` and `/api/admin/refresh` → **401** `{"error":"Unauthorized"}`.
- GHA `trend-ingest.yml` last 8 scheduled runs: all **success** (e.g. `31565688868` at `2026-08-12T05:10:47Z`).
- Migrations **001–018** present in Supabase `list_migrations` (incl. `017_anon_read_trends`, `018_niche_backfill`).
- Anon SELECT policies exist on `trend_records`, `trend_snapshots`, `trend_sources`, `trend_clusters`, `data_source_status`.
- Indexes exist on niche/platform/status/score/first_seen/last_seen/collected_at for `trend_records`.

## 3. What Is Broken

| Issue | Severity | Root cause | Evidence | Status |
|---|---|---|---|---|
| 24h/48h/72h feeds identical | P0 | Window uses `latestActivityAt`/`last_seen_at`; ingest sets `last_seen_at=now` for all upserts | Prod API: AI+24h/48h/72h all `total=40` same firstIds; SQL `last_seen_24h=352` = all rows; `first_24h=172` vs `first_72h=210`; `filters.ts:32-40`, `persist.ts:192` | FIXED locally §9 — deploy to prod |
| Controls seem to do nothing | P0 | UI is **draft → Submit**; chips only `patchDraft` until Submit | `DashboardFilters.tsx:22-23,87-93,109-129,316-324` | FIXED locally §9 — deploy to prod |
| AI niche shows non-AI IG/TikTok junk | P0 | Classifier default `return 'AI'` for unmatched text | `publicCopy.ts:88-131`; SQL niche counts AI=311/352; prod titles under AI niche are relationship/reels | FIXED locally §9 — deploy to prod |
| `published_at` always null | P1 | Collectors/persist never populate `published_at` | SQL `published_null=352` | OPEN |
| Reddit Unavailable | P1 | Public Reddit fetch 403; status `unavailable`, 0 records | curl Reddit rising → 403; `data_source_status.reddit` | OPEN |
| LinkedIn Unavailable | P1 | No `LINKEDIN_ACCESS_TOKEN` on Vercel env ls; collector needs token | `vercel env ls` (no LinkedIn token); status `unavailable` | OPEN |
| Provider adapter stubs empty | P2 | `src/lib/providers/*/fetchTrends` return `[]`; real work in `collectors.ts` | `youtube/index.ts:19-21` | OPEN (arch) |
| Local collector keys empty | P2 | Local `.env` has `YOUTUBE_API_KEY=EMPTY`; ScrapeCreators unset locally | Masked env table §4 | OPEN |
| Wrong query aliases (`window`,`platform`) ignored | P2 | Handler reads `timeframe` + `platforms` only | `route.ts:32-37`; wrong URL still returns mixed platforms | OPEN |
| Charts thin for young trends | P1 | Few snapshots per trend early | history series often 1–3 points | OPEN |
| `setInterval` only in client UI | OK | Not used for ingestion (would die on serverless) | Client-only intervals (dashboard refresh, alerts) | N/A |

## 4. Environment & Vercel

### Framework / build
- Framework: **Next.js 15.5.18** App Router (`package.json`), not Vite/Express.
- Build: `npm run build` → `.next` (Vercel default). `vercel.json` has **no** `buildCommand` override; crons + security headers only.
- Linked project: `prj_GbuxW3FXroxPochQ4tjf5e3bjvnq` / team `team_Gya9FUqYFDvnv9i0O8VffsEJ` / prod https://nemo-5696.vercel.app

### Env comparison (masked)

| Variable | .env.example | Local `.env` | Vercel Production | Vercel Preview | Read at |
|---|---|---|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | yes | SET | SET | SET | `config.ts`, `client.ts` |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | yes | SET | SET | SET | client |
| SUPABASE_SERVICE_ROLE_KEY | yes | SET | SET | SET | `admin.ts` server-only |
| SUPABASE_URL / ANON / SECRET / PUBLISHABLE | aliases | — | SET (prod) | partial | `config.ts` |
| CRON_SECRET | yes | SET | SET | SET | ingest/ops |
| YOUTUBE_API_KEY | yes | **EMPTY** | SET | SET | `collectors.ts:347` |
| SERPAPI_KEY / SEARCHAPI_KEY | yes | UNSET | SET | SET | collectors |
| SCRAPECREATORS_API_KEY | yes | UNSET | SET | SET | scrapeCreators |
| INSTAGRAM_ACCESS_TOKEN | yes | EMPTY | SET | SET | collectors |
| LINKEDIN_ACCESS_TOKEN | yes | EMPTY | **NOT in env ls** | NOT listed | collectors |
| TWITTER_BEARER_TOKEN | yes | UNSET | **NOT in env ls** | NOT listed | collectors (X via ScrapeCreators) |
| OPENROUTER_API_KEY | yes | SET | SET | SET | AI |
| NEXT_PUBLIC_DEMO_MODE | yes | — | not listed (defaults false) | — | status route |
| ALLOW_DEMO_AUTH / NEXT_PUBLIC_ALLOW_DEMO_AUTH | yes | — | SET | SET | auth (prod disables demo login path) |
| POSTGRES_URL / PRISMA / NON_POOLING | — | — | SET | — | Supabase integration (app uses JS client, not Prisma) |
| RAZORPAY_* | yes | EMPTY | not listed | — | deferred |

**Security:** No evidence service-role JWT is embedded in client chunks. Grep hit on `sb_secret_` is Supabase JS **prefix detector** string in `.next/static/chunks/5402-*.js`, not a key value.

**Redeploy vs env:** Collector keys were added ~14–16h before this audit; production redeployed multiple times since (incl. Phase A/B). Current prod is post-key.

### Cron / ingest
- `vercel.json`: cron `0 6 * * *` → `/api/trends/ingest` (daily) + ops crons.
- **Primary freshness:** GitHub Actions `*/30 * * * *` POST `/api/trends/ingest` with `CRON_SECRET` (`.github/workflows/trend-ingest.yml`).
- Evidence: 8/8 recent GHA runs success; `collector_runs` rows every ~30–120m; Vercel runtime path counts include `/api/trends/ingest` (1 in sampled 24h group — GHA hits may not all appear in that aggregation window).
- No server-side ingestion `setInterval` (only client UI timers).
- Ingest duration from DB: ~10–30s (`started_at`→`finished_at`), under typical Hobby function limits.

## 5. Supabase Database

### Naming vs brief
| Brief name | Actual table |
|---|---|
| trends | **`trend_records`** |
| trend_metric_snapshots | **`trend_snapshots`** |
| trend_sources | `trend_sources` |
| trend_clusters | `trend_clusters` |
| data_source_status | `data_source_status` |
| alerts / alert_rules / saved_trends / scoring_weights | present |

### Row counts / freshness (SQL, UTC)
```
trend_records=352 snapshots=1096 sources=199 clusters=200
last_seen_24h=352 last_seen_48h=352 last_seen_72h=352
first_24h=172 first_48h=192 first_72h=210
published_null=352
newest_source=2026-08-12 05:11:06.944+00
tz=UTC db_now=2026-08-12 06:07:05Z
```
Niche enum distribution: AI=311, education=10, movies=8, other=5, fitness=5, travel=4, food=4, gaming=2, fashion=2, finance=1.

Timestamps are **`timestamptz`**; timezone hypothesis of IST-vs-UTC type mismatch: **FALSIFIED**. Semantic bug is **last_seen bump**, not TZ storage.

### Migrations
Repo files `001`–`018` under `supabase/migrations/`. Applied remote names include through `018_niche_backfill`. **No gap** found vs intended brief alignment migrations.

### RLS
- RLS enabled on public product tables.
- Anon **can** SELECT trend tables (migration 017). Matches live public API.
- Server `getTrends` prefers **service role** (`store.ts:403-406`) then user anon client.
- `data_source_status` dump (abbrev): youtube/google_trends/instagram/tiktok/facebook **active**; twitter **partial**; reddit/linkedin **unavailable**; last_success ~`2026-08-12 05:11:08+00`.

### Connection model
App uses **Supabase JS** (`@supabase/supabase-js` / SSR), not app-owned `DATABASE_URL` pooling. Vercel also has `POSTGRES_URL` / `POSTGRES_PRISMA_URL` / `POSTGRES_URL_NON_POOLING` from integration — unused by trend read path.

## 6. Provider Integration Matrix

| Platform | Adapter file | Credential status (Vercel Prod) | Direct API test | In-app ingestion | Verdict | Evidence |
|---|---|---|---|---|---|---|
| YouTube | `providers/youtube` (stub fetch) + `collectors.ts` | YOUTUBE_API_KEY SET; ScrapeCreators SET | Local key EMPTY — **cannot curl with prod key from this machine without env pull** | 17 records last run; Live | **WORKING LIVE** | status + collector_runs |
| Google Trends | collectors via SerpAPI/SearchAPI | SERPAPI+SEARCHAPI SET | Not re-tested raw Serp (key not local) | 8 records; Live | **WORKING LIVE** | status |
| Instagram | collectors + ScrapeCreators/token | INSTAGRAM_ACCESS_TOKEN + ScrapeCreators SET | — | 8 records; Live | **WORKING LIVE** | status (content quality ≠ niche) |
| TikTok | ScrapeCreators | SCRAPECREATORS SET | — | 3 records; Live | **WORKING LIVE** | status |
| Facebook | page URL scrape | FACEBOOK_APP_* SET; page URLs in example | — | 8 records; Live | **WORKING LIVE** | status |
| X/Twitter | ScrapeCreators getdaytrends (+ optional bearer) | ScrapeCreators SET; bearer not in env ls | — | 12 records; Partial/estimated metrics | **WORKING LIVE (limited metrics)** | status |
| Reddit | collectors public JSON | no Reddit OAuth env | `rising.json` → **403 Forbidden** | 0 records; Unavailable | **CREDENTIAL/ACCESS PROBLEM** | curl 403 + status |
| LinkedIn | collectors token | **token missing on Vercel** | — | 0; Unavailable | **NO WORKING INTEGRATION / MISSING CRED** | env ls + status |

Silent mock fallback: production path returns empty array rather than mock when configured (`store.ts:453-457`). Prod responses `source=live`. **No silent mock-as-live** observed on production GETs.

## 7. Pipeline Trace

Observed path for one ingest cycle (from code + DB):

1. **Provider fetch** (`collectMvpTrendsDetailed` in `collectors.ts`) → dozens of raw items per platform (status counts 3–17).
2. **Normalize / classify niche** → `classifyTrendNiche` → many become **AI** (default).
3. **Persist** → `trend_records` upsert; **`last_seen_at = now`** (`persist.ts`); snapshots appended; sources rows.
4. **Scoring** → brief scoring + weights from `scoring_weights`; statuses in DB.
5. **Alert evaluate** → after ingest (0 alert_rules → no alerts).
6. **`/api/trends` GET** → load up to fetchLimit from `trend_records` → `scrubTrend` (re-classifies niche!) → `applyTrendFilters` → never-blank top-K → page 40.
7. **Dashboard** → fetch with `timeframe`/`niche`/`platforms` **only after Submit**.

Break points for reported symptoms:
- Count does **not** drop to zero at RLS.
- Window stage: **does not discriminate** because activity stamps refreshed (352≡352).
- Niche stage: **over-admits to AI** (311 rows).
- UI stage: draft changes without Submit → **zero request change**.

Sample live card (AI niche): Instagram reel “Just striving to reach Big Mike’s standards…” with `whyTrending` metrics — **live metrics, wrong niche**.

## 8. Hypothesis Verdicts

| ID | Verdict | Evidence |
|---|---|---|
| H1 No ingestion on Vercel | **FALSIFIED** | GHA success ×8; `collector_runs` fresh; status `last_success_at` today |
| H2 Providers fail → silent mock | **FALSIFIED** (for main path) | `source=live`; mock only non-prod fallback `store.ts:457`; several providers Live |
| H3 Timezone-broken windows | **FALSIFIED** as TZ-type bug; **CONFIRMED** related semantic bug | `timestamptz`+UTC; last_seen all within 24h |
| H4 RLS blanks anon reads | **FALSIFIED** | Anon policies + live API totals |
| H5 Backend ignores filter params | **FALSIFIED** for niche/platforms; **PARTIAL** for windows (applied but ineffective) | fitness=3; youtube-only platforms; 24=48=72 identical |
| H6 Frontend never sends filters | **PARTIAL / CONFIRMED UX** | Sends correct params **on Submit** (`DashboardContent.tsx:97-107`); draft-only clicks send nothing |
| H7 Niche classification empty/wrong | **CONFIRMED** | Default AI; 311/352 AI; junk under AI niche |
| H8 Scoring crash → stale feed | **INCONCLUSIVE / unlikely** | Ingest finishes without error; scores present; not empty |

**Impact rank:** H7 + last_seen window bug + H6 Submit UX ≫ provider outages.

## 9. Fixes Applied

> Applied locally after phases 0–8. **Not yet on production** until deploy. Instrumentation: none added (audit-only session).

### P0-1 — Time window uses emergence, not ingest bump
- **Root cause:** `withinTimeframe` used `latestActivityAt` (`filters.ts:32-40`); persist sets `last_seen_at=now` every ingest → all 352 rows matched 24h/48h/72h.
- **Change:** Window now uses `firstDetectedAt` only. Files: `src/lib/trends/filters.ts`.
- **Verification (local):**
  - Unit test `24h window uses firstDetectedAt, not ingest-bumped latestActivityAt` — **PASS** (`npm test`, 55/55).
  - Classifier smoke: trends at 2h vs 50h ago filter differently under 24h vs 72h in fixture simulation.

### P0-2 — Stop polluting AI niche
- **Root cause:** `classifyTrendNiche` defaulted unmatched → `AI`; stored `rawNiche` was included in match blob (`publicCopy.ts:131`).
- **Change:** Text-first classification; exclude `rawNiche` from blob; default `other`; trust non-AI stored labels only when text is empty. Tightened AI regex. Files: `src/lib/trends/publicCopy.ts`, `filters.ts` (`trendNiches` default `other`).
- **Verification (local):**
```
classifyTrendNiche({ rawNiche:'AI', title:'Just striving to reach Big Mike standards' }) → other
classifyTrendNiche({ rawNiche:'AI', title:'ChatGPT tips for creators' }) → AI
classifyTrendNiche({ title:'gym workout plan' }) → Fitness
```

### P0-3 — Filters apply immediately (niche/platform/window/sort)
- **Root cause:** Draft-only UX until Submit (`DashboardFilters.tsx:22-23,109-129`).
- **Change:** `toggleCategory`, `togglePlatform`, timeframe, sort auto-call `onFiltersChange`; Submit retained for keyword + geo. File: `src/app/components/DashboardFilters.tsx`.
- **Verification:** `DashboardContent.tsx:226-230` `handleFiltersChange` → `loadTrends(false, filters)` on each auto-apply.

### P0-4 — Honest provider labels
- **No code change.** Reddit/LinkedIn remain **Unavailable** in `/api/data-sources/status`; no mock-as-live.

**Post-deploy verification checklist:** Re-run Appendix A curls; expect AI 24h count < pre-fix; 24h vs 72h totals differ; Fitness niche unchanged; dashboard chip clicks change network URL without Submit.

## 10. Demo Dry-Run Checklist Results

Recorded against **production** https://nemo-5696.vercel.app **before P0 deploy** (API/curl + code audit). UI login/save/console need human browser pass after P0.

| # | Check | Result | Notes |
|---|---|---|---|
| 1 | Login works | INCONCLUSIVE here | Auth stack present; not interactive-tested this run |
| 2 | Dashboard &lt;3s with trends | PASS (API) | `/api/trends?timeframe=24h` 200, 40 trends |
| 3 | AI + 24H fresh plausible | FAIL quality | Fresh yes; many non-AI titles |
| 4 | 48H/72H visibly change | FAIL | Identical totals/firstIds |
| 5 | Niche Fitness changes | PASS | 3 vs 40 |
| 6 | Platform YouTube | PASS (API param) | `platforms=youtube` youtube-only |
| 7 | Trend detail score/status/chart/source | PARTIAL | Score/why present; chart sparse points |
| 8 | Last updated recent | PASS | `lastIngestAt` / collectedAt ~05:11Z |
| 9 | One provider fail ≠ blank dash | PASS | Reddit Unavailable; feed still live |
| 10 | Save trend | INCONCLUSIVE | Not exercised |
| 11 | No console errors | INCONCLUSIVE | Needs browser |
| 12 | Demo data labeled | PASS | `demo:false`; Unavailable labeled |

## 11. Open Items & Post-Demo Roadmap

**P1**
1. Populate `published_at` from provider payloads; use in freshness.
2. Reddit OAuth / proper User-Agent path or keep Unavailable.
3. Add `LINKEDIN_ACCESS_TOKEN` or keep Unavailable.
4. Richer snapshot history (more ingest cycles + chart UX).
5. Accept `window`/`platform` aliases in API for robustness.
6. Niche backfill SQL after classifier fix.

**P2**
1. Unify provider adapters vs `collectors.ts` (remove empty stubs or wire them).
2. Sync local `.env` collector keys via `vercel env pull` for local ingest.
3. PWA SW cache busting audit on deploy.
4. Expand automated acceptance tests 1–14.
5. Razorpay / billing (deferred by product).

---

## Appendix A — Phase 1 reproduction captures

### R1 AI 24h (correct params)
`GET https://nemo-5696.vercel.app/api/trends?niche=AI&timeframe=24h`  
→ `source=live total=40 totalBeforeFilter=200` firstIds `trend-11033211,trend-41cd4bb6,trend-3fa28e55,...` Instagram-heavy.

### R2 48h / 72h
Same totals and same firstIds as 24h (**FAIL** expected differentiation).

### R3 Fitness
`niche=fitness&timeframe=24h` → `total=3`.

### R4 YouTube
`platforms=youtube&timeframe=24h` → platforms only youtube/youtube_shorts (`youtube_shorts:27 youtube:13`).

### Wrong aliases
`window=24h&platform=youtube` → **does not** filter platforms (mixed IG/TikTok/…).

### R5 Detail
`/api/trends/trend-11033211` returns score, lifecycle, whyTrending, related. History has multi-window series with few points.

### R6 Last updated
API `lastIngestAt=2026-08-12T05:11:03.284+00:00` aligns with `collector_runs`.

### R7 Live vs Demo
Status `demo:false`; labels Live/Partial/Unavailable.

## Appendix B — Top-level structure (2 levels)

`src/app` (pages + `api`), `src/lib` (trends, providers, supabase, signals), `src/components`, `supabase/migrations`, `scripts`, `public`, `.github/workflows`, `vercel.json`, `package.json`.
