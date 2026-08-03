# NEMO DEBUG REPORT

**Workspace:** `C:\Users\nitin\Projects\nemo_5696`  
**Date:** 2026-08-04  
**Base commit reused:** `caa7ae4` (prior P0 security hardnening) + this working-tree pass  
**Governing spec:** interrupt superseding master-debug doc (debug existing product; no speculative features)

---

## Command evidence (this run)

| Step | Result |
|---|---|
| `node --version` | `v24.14.1` |
| `npm --version` | `11.13.0` |
| `npm ci` | ❌ EPERM unlink on `@next/swc-win32-x64-msvc` (file locked by running Node). Used existing `node_modules` + `npm uninstall`/`npm install --package-lock-only` to drop unused deps. |
| `npm run type-check` | ✅ exit 0 |
| `npm run lint` | ✅ exit 0 (warnings remain; **no errors**) |
| `npm test` | ✅ 10/10 pass (catalogue, requestPolicy, admin cookie helper) |
| `npm run build` | ✅ exit 0 (`/api/trends/ingest`, `/api/user/account` present in route table) |

`next.config.mjs`: `eslint.ignoreDuringBuilds: false`, `productionBrowserSourceMaps: false` — **kept false deliberately** (IP / source protection from prior P0). Documented as accepted gate exception until security owners flip it.

CI: `.github/workflows/ci.yml` runs `npm ci` → type-check → lint → test → build.

---

## Phase findings summary

### PHASE 0 — Baseline
```
PHASE 0 FINDINGS
[P0-CRITICAL] (env) npm ci EPERM on Windows SWC binary — file lock from running node — close Next/dev processes then npm ci — deferred locally; CI uses clean ubuntu npm ci
[P1-HIGH]     package.json — dual toasts + Netlify plugin — removed react-hot-toast + @netlify/plugin-nextjs; standardized on sonner
[P2-MEDIUM]   next.config.mjs:productionBrowserSourceMaps=false — deliberate IP exception (not flipped)
[P2-MEDIUM]   PWA incomplete — Option B chosen: removed manifest link from layout; no next-pwa in package.json
PASS: type-check, lint (0 errors), build, unit tests
```

### PHASE 1 — Backend / API security
```
PHASE 1 FINDINGS
[P0-CRITICAL] src/app/api/admin/*/route.ts — auth used nemo_admin_session cookie — replaced with requireAdminSession() (profiles.is_admin) — test: src/lib/admin/auth.test.ts
[P0-CRITICAL] src/context/AuthContext.tsx + AuthScreen — DEMO passwords in client path — gated behind NODE_ENV!==production + NEXT_PUBLIC_ALLOW_DEMO_AUTH; prod returns demo_disabled — verified by code path
[P0-CRITICAL] AppSidebar/ReportsContent/payment-success — localStorage nemo_plan feature gating — removed; UI plan from profile only
[P0-CRITICAL] src/lib/trends/store.ts getTrends — public GET auto-ingested collectors — made read-only; cron via /api/trends/ingest + vercel.json
[P0-CRITICAL] src/lib/supabase/middleware.ts — missing Supabase skipped auth — hard 503 in production/Vercel
[P0-CRITICAL] src/app/auth/callback/route.ts — origin Host trust — trustedOrigin vs NEXT_PUBLIC_SITE_URL
[P1-HIGH]     src/app/admin-panel/.../AdminPanelContent.tsx — master-code UX — replaced with role-based enter
[P1-HIGH]     admin dashboard mock fallback — returns 503 instead of fake KPIs when Supabase down
[P1-HIGH]     AI HTTP rate limit (per-IP) — NOT implemented (quota atomic RPC exists) — remaining gate blocker for abuse
[P2-MEDIUM]   Concurrent quota + billing webhook E2E tests — unit coverage only for catalogue/policy/admin cookie
PASS: AI requireAuth before provider (chat-completion); usage.ts no cookie plan; billing catalogue server-side (prior caa7ae4); trends POST CRON_SECRET; ingest route added
```

### PHASE 2 — Supabase
```
PHASE 2 FINDINGS
[P0-CRITICAL] Account deletion missing — added DELETE /api/user/account + Settings danger zone
[P1-HIGH]     Analytics retention — migration 009 + applied purge_analytics_older_than_90_days via MCP; PRIVACY.md
[P1-HIGH]     sanitizeProperties non-recursive — now recursive with value-pattern redaction
[P2-MEDIUM]   billing_webhook_events RLS on, 0 policies — intentional service_role-only (bypasses RLS)
[P2-MEDIUM]   User A vs B automated RLS tests — not in CI yet
[P2-MEDIUM]   Structured data export API — not implemented (delete exists; export = support path in PRIVACY.md)
PASS: Live staging RLS audit — all public tables rls_enabled=true; is_admin column present; billing_orders + webhook tables exist; migrations 001–009 in repo
```

### PHASE 3 — Frontend
```
PHASE 3 FINDINGS
[P1-HIGH]     Full browser journey matrix (1440/768/390/320) — NOT executed this run
[P1-HIGH]     Four-states + a11y Lighthouse — NOT fully audited this run
[P2-MEDIUM]   Remaining eslint warnings (any, unused vars, img alt on AppImage)
[P3-LOW]      Fake moderation queue removed from admin-panel (was hard-coded demo)
PASS: PWA Option B; sonner-only toasts; admin login UI aligned with is_admin; account delete UI
```

### PHASE 4 — PWA
```
PHASE 4 FINDINGS
[P1-HIGH]     Incomplete PWA — Option B: no service worker claims; manifest removed from metadata
PASS: Decision documented; next-pwa was already absent from package.json
```

### PHASE 5 — Secrets / Vercel
```
PHASE 5 FINDINGS
[P1-HIGH]     vercel.json cron pointed at GET /api/trends (no ingest) — fixed → /api/trends/ingest + security headers
[P2-MEDIUM]   Operators must still set Vercel env vars + Supabase Auth redirect URLs (ops checklist)
PASS: No SERVICE_ROLE in client files found in this pass; .env not committed
```

### PHASE 6–7 — Tests / release
```
PHASE 6-7 FINDINGS
[P1-HIGH]     AI/billing/RLS/E2E suites incomplete vs gate list
[P1-HIGH]     Manual Razorpay test-mode checkout not run here
PASS: CI workflow present; unit tests green; production build green
```

---

## Findings detail (required fields)

### F01 — Admin cookie auth bypass
- **Severity:** P0  
- **File/route:** `src/app/api/admin/**`  
- **Steps:** Set `nemo_admin_session=1` cookie without Supabase admin user → call `/api/admin/dashboard`  
- **Root cause:** Routes checked UX cookie instead of `profiles.is_admin`  
- **Exact fix:** `requireAdminSession()` on all admin APIs; `isAdminCookie` always false  
- **Test added:** `src/lib/admin/auth.test.ts`  
- **Verification:** unit test pass; code grep shows no remaining auth reads of cookie (login still sets UX cookie only)

### F02 — Demo passwords in client bundle path
- **Severity:** P0  
- **File:** `src/context/AuthContext.tsx`, `AuthScreen.tsx`  
- **Steps:** Build production bundle; search for `NEMO_MASTER_2026`  
- **Root cause:** Module-level DEMO_USERS always defined  
- **Exact fix:** `getDemoUsers()` returns null in production; AuthScreen DEMO_CREDENTIALS empty in production  
- **Test added:** (build-time DCE; no runtime unit)  
- **Verification:** type-check/build pass; production path returns `demo_disabled`

### F03 — localStorage plan unlocks UI features
- **Severity:** P0  
- **File:** `AppSidebar.tsx`, `ReportsContent.tsx`, `payment-success/page.tsx`, `AuthContext.setLocalPlan`  
- **Steps:** `localStorage.setItem('nemo_plan','agency')` without paying  
- **Root cause:** UI read `nemo_plan` for gating  
- **Exact fix:** Plan from `profile.plan` only; setLocalPlan no-ops to refreshProfile  
- **Test added:** none (manual)  
- **Verification:** grep shows no remaining `getItem('nemo_plan')` feature paths

### F04 — Public trends GET triggered collectors
- **Severity:** P0  
- **File:** `src/lib/trends/store.ts`, `vercel.json`  
- **Steps:** Hit `GET /api/trends` after TTL → collectors ran  
- **Root cause:** `getTrends` auto-ingested; cron pointed at read route  
- **Exact fix:** Read-only `getTrends`; `/api/trends/ingest` + cron path; CRON_SECRET  
- **Test added:** none (route present in build output)  
- **Verification:** build lists `/api/trends/ingest`

### F05 — Middleware auth skip when Supabase missing
- **Severity:** P0  
- **File:** `src/lib/supabase/middleware.ts`  
- **Steps:** Deploy without Supabase env → all routes public  
- **Root cause:** Early return without fail-closed  
- **Exact fix:** 503 in production/Vercel when unconfigured  
- **Test added:** none  
- **Verification:** code review

### F06 — Account deletion missing
- **Severity:** P0 (gate)  
- **File:** `src/app/api/user/account/route.ts`, `ProfileTab.tsx`  
- **Steps:** Settings → no delete  
- **Root cause:** Feature absent  
- **Exact fix:** `DELETE` with `{confirm:"DELETE"}` via service role `auth.admin.deleteUser` + UI danger zone  
- **Test added:** none (manual)  
- **Verification:** route in build output

### F07 — Dual toast libraries / Netlify plugin
- **Severity:** P1  
- **File:** `package.json`, AppLayout, AIChatPanel, ViralScriptWriter  
- **Root cause:** Historical deps  
- **Exact fix:** sonner only; removed react-hot-toast + @netlify/plugin-nextjs  
- **Verification:** lint/build

---

## Remaining P2/P3 (awaiting approval — not implemented unless trivial)

1. Flip `productionBrowserSourceMaps` to `true` (ops preference vs IP)  
2. Automated User A/B RLS tests + AI concurrent quota test + billing webhook suite  
3. Per-IP AI rate limiter (Upstash/Vercel KV)  
4. Full browser journey + Lighthouse a11y  
5. Structured GDPR export endpoint  
6. Encrypt `user_connections.metadata` tokens at rest  
7. html2canvas dynamic import / img→next/image audit  

---

## Release gate

### Checklist
| Item | Status |
|---|---|
| type-check / lint errors / build | ✅ |
| Unit tests in CI | ✅ (partial coverage) |
| Admin cookie not auth | ✅ |
| Demo passwords production-safe | ✅ (code) — re-verify bundle grep on CI artifact |
| Plan not from localStorage | ✅ |
| Trends ingest cron path | ✅ |
| Middleware fail-closed | ✅ |
| Account delete | ✅ |
| RLS enabled all tables | ✅ (live MCP) |
| AI per-IP rate limit | ❌ |
| Billing/AI/RLS E2E + Razorpay test mode | ❌ |
| Full UI journey / a11y | ❌ |
| Source maps decision accepted | ✅ exception documented |

### Verdict

**NOT READY** for Vercel production.

**Blockers:** AI HTTP rate limiting; payment + RLS/E2E verification in staging; frontend journey/a11y evidence; clean `npm ci` on a machine without SWC file locks (CI should cover); operator env + Auth URL config.
