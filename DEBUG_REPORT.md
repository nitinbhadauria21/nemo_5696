# NEMO DEBUG REPORT

**Workspace:** `C:\Users\nitin\Projects\nemo_5696`  
**Date:** 2026-08-04 (updated same day - rate limit + P2 pass)  
**HEAD (local/origin after A->D):** see git `main` after push of this pass  
**Governing spec:** interrupt superseding master-debug doc (debug existing product; no speculative features)

---

## Command evidence (this run)

| Step | Result |
|---|---|
| `git push origin HEAD` (4 prior commits) | ✅ `0dd3cdd..b1c7cec` -> `origin/main` |
| `npm run type-check` | ✅ exit 0 |
| `npm run lint` | ✅ exit 0 (warnings remain; **no errors**) |
| `npm test` | ✅ **19/19** pass (catalogue, webhookSignature, requestPolicy, rateLimit, admin cookie, sanitizeMetadata) |
| `npm run build` | ✅ exit 0 |

`next.config.mjs`: `eslint.ignoreDuringBuilds: false`, `productionBrowserSourceMaps: false` - **kept false deliberately** (IP / source protection). Comment in config documents ops flip path. Accepted gate exception.

CI: `.github/workflows/ci.yml` runs `npm ci` -> type-check -> lint -> test -> build.

---

## Phase findings summary

### PHASE 0 - Baseline
```
PHASE 0 FINDINGS
[P0-CRITICAL] (env) npm ci EPERM on Windows SWC binary - file lock from running node - close Next/dev processes then npm ci - deferred locally; CI uses clean ubuntu npm ci
[P1-HIGH]     package.json - dual toasts + Netlify plugin - removed react-hot-toast + @netlify/plugin-nextjs; standardized on sonner
[P2-MEDIUM]   next.config.mjs:productionBrowserSourceMaps=false - deliberate IP exception (not flipped); documented
[P2-MEDIUM]   PWA incomplete - Option B chosen: removed manifest link from layout; no next-pwa in package.json
PASS: type-check, lint (0 errors), build, unit tests
```

### PHASE 1 - Backend / API security
```
PHASE 1 FINDINGS
[P0-CRITICAL] admin cookie auth -> requireAdminSession() (prior)
[P0-CRITICAL] DEMO passwords production-gated (prior)
[P0-CRITICAL] localStorage plan gating removed (prior)
[P0-CRITICAL] trends GET read-only + /api/trends/ingest + CRON_SECRET (prior)
[P0-CRITICAL] middleware fail-closed without Supabase (prior)
[P0-CRITICAL] auth callback trustedOrigin (prior)
[P1-HIGH]     AI HTTP rate limit - IMPLEMENTED: in-memory sliding window per-IP (30/min) + per-user (20/min) on /api/ai/chat-completion; 429 + Retry-After. Documented: Redis/Vercel KV required for multi-instance.
[P2-MEDIUM]   billing webhook HMAC extracted to webhookSignature.ts + unit tests; live Razorpay test-mode still manual
PASS: AI requireAuth + rate limit + monthly quota RPC; usage.ts no cookie plan
```

### PHASE 2 - Supabase
```
PHASE 2 FINDINGS
[P0-CRITICAL] Account deletion - DELETE /api/user/account (prior)
[P1-HIGH]     Analytics retention migration 009 + PRIVACY.md (prior)
[P2-MEDIUM]   connection metadata - sanitizeConnectionMetadata on GET; OAuth callback stores status flags only (no raw tokens). Full envelope encryption deferred until tokens are actually persisted.
[P2-MEDIUM]   User A vs B automated RLS tests - not in CI yet
[P2-MEDIUM]   Structured data export API - not implemented (delete exists; export = support path in PRIVACY.md)
PASS: Live staging RLS audit prior; billing_webhook_events service_role-only intentional
```

### PHASE 3 - Frontend
```
PHASE 3 FINDINGS
[P1-HIGH]     Full browser journey matrix (1440/768/390/320) - NOT executed (no Playwright browser E2E in CI)
[P1-HIGH]     Full Lighthouse a11y - NOT executed; focused fixes: AIChatPanel dialog/aria/error + AppImage alt for eslint a11y
[P2-MEDIUM]   Remaining eslint warnings (any, unused vars) - non-blocking
[P2-MEDIUM]   html2canvas - already dynamic import in CarouselStudio; AppImage already wraps next/image
PASS: sonner-only; admin role UI; account delete UI
```

### PHASE 4 - PWA
```
PHASE 4 FINDINGS
[P1-HIGH]     Incomplete PWA - Option B (prior)
PASS: Decision documented
```

### PHASE 5 - Secrets / Vercel
```
PHASE 5 FINDINGS
[P1-HIGH]     vercel.json cron -> /api/trends/ingest (prior)
[P2-MEDIUM]   Operators must set Vercel env + Auth redirect URLs (checklist below) - secrets not invented here
PASS: No SERVICE_ROLE in client; .env not committed
```

### PHASE 6-7 - Tests / release
```
PHASE 6-7 FINDINGS
[P1-HIGH]     Staging Razorpay checkout + full AI/billing/RLS E2E against live keys - still manual / not in CI
[P1-HIGH]     Full UI journey + Lighthouse - evidence gap remains
PASS: CI workflow; 19 unit tests green; production build green; AI rate limit covered by unit tests
```

---

## Findings detail (required fields)

### F01-F07 - Prior P0/P1 (see previous revision)
Admin cookie, demo passwords, localStorage plan, trends ingest, middleware fail-closed, account delete, toast/Netlify cleanup - remaining as fixed.

### F08 - AI HTTP rate limit missing
- **Severity:** P1 (was gate blocker)  
- **File/route:** `src/app/api/ai/chat-completion/route.ts`, `src/lib/ai/rateLimit.ts`  
- **Steps:** Authenticated burst of POST `/api/ai/chat-completion` from one IP/user  
- **Root cause:** Only monthly quota RPC; no short-window HTTP throttle  
- **Exact fix:** In-memory sliding window - IP 30/60s, user 20/60s; returns 429 `{ error: 'rate_limited', scope }` + `Retry-After`  
- **Test added:** `src/lib/ai/rateLimit.test.ts`  
- **Verification:** unit tests; note multi-instance needs Redis/KV  

### F09 - Connection metadata credential leakage risk
- **Severity:** P2  
- **File:** `src/app/api/user/connections/route.ts`, `src/lib/connections/sanitizeMetadata.ts`  
- **Root cause:** GET returned raw `metadata` JSONB  
- **Exact fix:** Strip token/secret keys on read; OAuth callback documents no plaintext tokens  
- **Test added:** `src/lib/connections/sanitizeMetadata.test.ts`  
- **Deferred:** Envelope encryption at rest - not needed until credential material is stored  

---

## Remaining P2/P3

| Item | Status |
|---|---|
| 1. Flip `productionBrowserSourceMaps` to `true` | **Deferred** - keep `false` for IP; documented in config + this report |
| 2. Automated User A/B RLS + AI concurrent quota + full billing E2E | **Partial** - webhook HMAC unit tests added; live RLS/Razorpay/quota concurrency still open |
| 3. Per-IP AI rate limiter | **Done** (in-memory single-instance); Redis/KV follow-up for multi-instance |
| 4. Full browser journey + Lighthouse a11y | **Partial** - focused a11y only; matrix/Lighthouse not run |
| 5. Structured GDPR export endpoint | **Deferred** - speculative vs PRIVACY support path |
| 6. Encrypt `user_connections.metadata` tokens at rest | **Partial** - no tokens stored today; sanitize on read; encrypt when storing credentials |
| 7. html2canvas dynamic / img->next/image | **Done** (already present; AppImage alt a11y tightened) |

---

---

## Vercel production deploy diagnosis (2026-08-04)

### Root cause (most likely)

**Hobby-plan Cron Jobs reject `*/30 * * * *`.** CLI production deploy failed with:

> Hobby accounts are limited to daily cron jobs. This cron expression (`*/30 * * * *`) would run more than once per day.

That blocks **every** deployment (Production and Preview) while `vercel.json` on `origin/main` still has the 30-minute schedule. Local working tree was changed to Hobby-safe `0 6 * * *` (daily 06:00 UTC).

**Contributing factors (why Overview shows "No Production Deployment"):**
1. Project **nemo-5696** (`prj_GbuxW3FXroxPochQ4tjf5e3bjvnq`) was created **~1 min after** the last `main` push (`c41f0bd` at `2026-08-03T22:43:14Z`; project ~`22:44Z` IST 04:14). No git push happened *after* the project existed, so auto Production never fired even before the cron error.
2. CLI `vercel ls` / project inspect: **zero deployments**, Production URL `--`, team domains **0**. Overview checklist "Preview Deployment ✅ / Custom Domain ✅" is **setup UI**, not evidence of a live Production alias.
3. Name note: dashboard/CLI project is **`nemo-5696`** (matches repo `nemo_5696`), not `nemo-5896`. Team CLI alias `nemo-4757` / owner **Nemo** (Hobby limits apply — matches "Nemo Hobby" UI naming).

### Git / GitHub evidence

| Check | Result |
|---|---|
| Local branch | `main` tracking `origin/main` |
| HEAD == origin/main | `c41f0bd8048723e297267016e657ce39d3ffa615` (synced; no unpushed commits before this pass) |
| Remote | `https://github.com/nitinbhadauria21/nemo_5696.git` |
| Default branch | `main` |
| GitHub Deployments API | empty |
| Commit statuses / Vercel checks on `c41f0bd` | none (only GitHub Actions `check`) |
| Repo webhooks (`gh`) | none listed (GitHub App may still be installed; no Vercel check-runs on latest SHA) |
| CI on `main` @ `c41f0bd` | **success** (~2m) — type-check, lint, test, build |
| Build config risk | `package.json` `"build": "next build"`; `next.config.mjs` eslint fail-on-error (CI green); `vercel.json` only crons+security headers |

**Build would pass** on Vercel once Hobby cron is daily (CI already proves `npm run build`).

### CLI probe (authenticated)

| Field | Value |
|---|---|
| CLI user | `nitinbhadauria23-4750` (`npx vercel@58.4.4 whoami`) |
| Scope / org | `nemo-4757` / `team_Gya9FUqYFDvnv9i0O8VffsEJ` |
| Local link | `.vercel/project.json` → `prj_GbuxW3FXroxPochQ4tjf5e3bjvnq` / `nemo-5696` |
| `vercel env ls` | **No Environment Variables** |
| `vercel deploy --prod` (with `*/30`) | **Failed** — Hobby cron limit (definitive) |
| `vercel deploy --prod` (after daily cron) | Upload then intermittent **`fetch failed`** (network); no deployment recorded |
| `VERCEL_TOKEN` in shell env | missing (session auth used instead) |

### Env vars that MUST be set before the site works (Production)

Set in Dashboard → **Settings → Environment Variables** (Production; add Preview if you use PR previews). Values from your secret store — **do not invent**:

| Variable | Required |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yes — canonical HTTPS origin, no trailing slash |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server only) |
| `CRON_SECRET` | Yes — Cron `Authorization: Bearer …` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` / `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Yes for billing (test mode first) |
| `AI_PROVIDER` + matching API key (`ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / …) | Yes if AI enabled |
| `SUPABASE_AUTO_CONFIRM`, `NEXT_PUBLIC_ALLOW_DEMO_AUTH`, `ALLOW_DEMO_AUTH` | Must stay **false/unset** |

Also: Supabase Auth Site URL + redirects `{SITE_URL}/auth/callback` (+ OAuth callbacks); Razorpay webhook `{SITE_URL}/api/billing/webhook`.

### Exact click-path — do this NOW (fastest)

**Path A — Git Production (preferred once cron fix is on `main`):**
1. Commit + push `vercel.json` with cron `0 6 * * *` to `main` (Hobby-safe). Upgrade to Pro later if you need `*/30`.
2. Open [Vercel](https://vercel.com) → team **Nemo** / **Nemo Hobby** → project **nemo-5696**.
3. **Settings → Git**: confirm connected repo is `nitinbhadauria21/nemo_5696`, **Production Branch = `main`**.
4. If the push did not create a deployment: **Deployments → Create Deployment** → branch **`main`** → Deploy.
5. After first ready deployment: open it → **⋯ → Promote to Production** (only if it landed as Preview).
6. **Before** expecting auth/billing/AI/cron to work: **Settings → Environment Variables** → set the table above → **Redeploy**.

**Path B — CLI (if Git UI stalls):**
```text
npx vercel@58.4.4 deploy --prod --yes --scope nemo-4757
```
Retry if `fetch failed`. Requires local `vercel.json` already on daily cron.

**Do not** rely on "Promote" until at least one successful deployment exists (currently none).

### Cron decision

| Plan | Allowed in `vercel.json` |
|---|---|
| Hobby (current) | Daily only → use `0 6 * * *` |
| Pro | Can restore `*/30 * * * *` |

### Unblock result (same session)

| Item | Status |
|---|---|
| Pushed Hobby-safe cron to `main` | ✅ `f4b7ab9` via GitHub Contents API (local `git commit` blocked — no git `user.name`/`user.email`; config not modified) |
| Git-triggered Production deploy | ✅ **Ready** `https://nemo-5696-nthilm2le-nemo-4757.vercel.app` |
| Production alias | ✅ `https://nemo-5696.vercel.app` |
| CI @ `f4b7ab9` | ✅ success (~1m36s) |
| App env vars on Vercel | ❌ still **none** — site shell may load; auth/billing/AI/cron will not work until set |
| CLI `vercel deploy --prod` retries | ❌ intermittent `fetch failed` after upload (Git path succeeded instead) |

**Verdict: NOT READY FOR VERCEL** — Production **exists**, but gate stays closed (**zero** app env vars; staging Razorpay/RLS/UI evidence still open).

## Operator checklist (Vercel / staging - do not invent secrets)

Set these in Vercel project env (values from your secret store / Razorpay / Supabase dashboards):

1. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
2. `NEXT_PUBLIC_SITE_URL` (production canonical origin)
3. `CRON_SECRET` (must match Vercel cron `Authorization: Bearer …`)
4. Razorpay: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` (**test mode first**)
5. AI provider keys used by `src/lib/ai/providers.ts`
6. Supabase Auth -> redirect URLs include `{SITE_URL}/auth/callback` and OAuth callbacks
7. After deploy: hit checkout with Razorpay **test** keys; confirm webhook signatures; smoke AI chat 429 under burst

Local Windows: close node locking `@next/swc-*` before `npm ci` if EPERM.

---

## Release gate

### Checklist
| Item | Status |
|---|---|
| type-check / lint errors / build | ✅ |
| Unit tests in CI | ✅ (expanded; still not full E2E) |
| Admin cookie not auth | ✅ |
| Demo passwords production-safe | ✅ (code) |
| Plan not from localStorage | ✅ |
| Trends ingest cron path | ✅ |
| Middleware fail-closed | ✅ |
| Account delete | ✅ |
| RLS enabled all tables | ✅ (prior live MCP) |
| AI per-IP (+ per-user) rate limit | ✅ (single-instance in-memory) |
| Billing/AI/RLS E2E + Razorpay test mode | ❌ staging evidence still required |
| Full UI journey / a11y Lighthouse | ❌ partial focused fixes only |
| Source maps decision accepted | ✅ keep `false` |

### Verdict

**NOT READY** for Vercel production.

**Remaining blockers:**
1. ~~First successful Vercel Production deploy~~ ✅ `https://nemo-5696.vercel.app` (Hobby daily cron)
2. Operator env vars on Vercel (all currently **Missing**) + Supabase redirects + Razorpay webhook URL
3. Staging Razorpay **test-mode** checkout + webhook end-to-end evidence (needs live test keys — not inventable here)
4. Automated or scripted User A/B RLS proof in CI (or signed-off staging SQL audit refresher)
5. Full browser journey + Lighthouse a11y evidence (Playwright/manual) — focused a11y only so far
6. Optional hardening: shared Redis/KV rate limit before horizontal scale-out
