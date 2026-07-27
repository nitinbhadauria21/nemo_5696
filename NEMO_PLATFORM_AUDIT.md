# Nemo Platform — Feature Audit Report
**Date:** 27 July 2026  
**Branch:** `feat/cursor-ownership-and-foundation`  
**Source Documents:** Nemo_MoSCoW_Navigation.pdf · Nemo_UX_Architecture_Complete.pdf · Nemo_DataSignals_Scoring.pdf

---

## Legend
| Symbol | Meaning |
|--------|---------|
| ✅ | Built & integrated |
| ⚠️ | Partially built (UI or mock fallback remains) |
| ❌ | Not built |

---

## SECTION 1 — PAGES & ROUTES

### 1.1 User-Facing Pages

| # | Page | Route | Status | Notes |
|---|------|-------|--------|-------|
| 1 | Landing | `/` | ✅ | Dark v2 landing with CTAs to `/signup`, `/login` |
| 2 | Sign Up | `/signup` | ✅ | Canonical route renders `AuthScreen`; legacy `/sign-up-login-screen` kept |
| 3 | Login | `/login` | ✅ | Canonical route; demo accounts work without Supabase |
| 4 | Email Verification | `/verify-email` | ⚠️ | Page exists; middleware enforces when Supabase auth configured |
| 5 | Onboarding | `/onboarding` | ⚠️ | 4-step wizard; real OAuth redirect on step 3; middleware gate on `onboarding_complete` |
| 6 | Dashboard | `/dashboard` | ⚠️ | Live trends via `/api/trends`; memory/mock fallback without Supabase |
| 7 | Trend Detail | `/trend/[id]` | ⚠️ | Related trends chips, top content panel, geo/volume charts; mock fallback |
| 8 | Explore | `/explore` | ⚠️ | Page exists; heatmap partially mock |
| 9 | Content Queue | `/queue` | ⚠️ | Kanban UI; `/api/queue` with Supabase when configured |
| 10 | Reports | `/reports` | ⚠️ | Charts + PDF gate via `PLAN_FEATURES` |
| 11 | Settings | `/settings` | ⚠️ | Profile, Niches, Platforms, **Social Connect**, Subscription, API tabs |
| 12 | Pricing | `/pricing` | ✅ | Plan cards, billing toggle, FAQ |
| 13 | Checkout | `/checkout` | ⚠️ | Razorpay checkout.js when keys set; mock path otherwise |
| 14 | Payment Success | `/payment-success` | ✅ | Confirms plan upgrade |
| 15 | Forgot Password | `/forgot-password` | ⚠️ | UI ready; needs Supabase email templates |
| 16 | Reset Password | `/reset-password` | ⚠️ | UI ready; needs Supabase email templates |
| 17 | 404 | `not-found.tsx` | ✅ | |

### 1.2 Admin Panel

| Page | Route | Status |
|------|-------|--------|
| Dashboard | `/admin/dashboard` | ⚠️ Re-exports admin-panel |
| User Analytics | `/admin/analytics` | ⚠️ Charts + admin API |
| Revenue | `/admin/revenue` | ⚠️ MRR estimates from profile counts |
| System Health | `/admin/health` | ⚠️ SystemHealthPanel + collector status |
| Keywords | `/admin/keywords` | ❌ Placeholder (v2) |
| Platforms | `/admin/platforms` | ❌ Placeholder (v2) |

---

## SECTION 2 — MIDDLEWARE & GUARDS

| Guard | Status | Implementation |
|-------|--------|----------------|
| Unauthenticated → `/login` | ✅ | `src/lib/supabase/middleware.ts` |
| Email unverified → `/verify-email` | ✅ | Checks `user.email_confirmed_at` |
| Onboarding incomplete → `/onboarding` | ✅ | Checks `profiles.onboarding_complete` |
| Social connect enforcement | ⚠️ | Required in onboarding step 3; not middleware-blocked post-onboard |
| Free plan AI/report gates | ⚠️ | `src/lib/billing/usage.ts` on AI routes |

---

## SECTION 3 — DATA PIPELINE

| Component | Status | Notes |
|-----------|--------|-------|
| Migration 001–002 | ✅ | `profiles`, `trend_records`, bookmarks, queue, connections |
| Migration 003 `trend_snapshots` | ✅ | `supabase/migrations/003_trend_snapshots.sql` |
| `.env.example` | ✅ | Supabase, cron, OAuth, Razorpay keys documented |
| Service role client | ✅ | `src/lib/supabase/admin.ts` |
| Ingestion cron | ✅ | `POST /api/trends` + `x-cron-secret`; `vercel.json` cron every 30m |
| Snapshot + upsert | ✅ | `src/lib/trends/persist.ts` |

---

## SECTION 4 — VERIFICATION (Wave 1–3)

### Wave 1 — Local without Supabase ✅
- `npm run type-check` — pass
- `npm run build` — pass (53 routes)
- Demo login (`priya.mehta@studio.in` / `Nemo@2026`) → dashboard
- Trends from memory/mock when Supabase unset

### Wave 2 — With Supabase (manual setup required)
1. Create Supabase project; copy keys to `.env`
2. Run migrations 001 → 002 → 003 in SQL editor
3. Configure Auth redirect URLs + OAuth providers
4. Verify: signup → verify email → onboarding → dashboard with `source: supabase`
5. Test bookmark/queue persistence, Razorpay test webhook → `profiles.plan`

### Wave 3 — Production readiness checklist
- [ ] RLS policies verified for user-scoped tables
- [ ] `CRON_SECRET` set; ingestion not callable from browser without secret
- [ ] OAuth tokens server-only (never returned to client)
- [ ] Prod: disable silent mock fallback when Supabase down

---

## SECTION 5 — KEY FILES

| Area | Files |
|------|-------|
| Auth & middleware | `AuthContext.tsx`, `middleware.ts` |
| Trends pipeline | `store.ts`, `persist.ts`, `collectors.ts`, `scoringEngine.ts` |
| OAuth | `api/auth/oauth/[provider]/route.ts`, callback |
| Billing | `create-order`, `verify-payment`, `webhook`, `usage.ts` |
| Settings Social | `SocialConnectTab.tsx` |
| Admin | `admin/analytics`, `admin/revenue`, `admin/health` |

---

## Remaining gaps (post-MVP)

1. **Supabase project** — must be created manually; apply migrations from repo
2. **Collector API keys** — YouTube/Reddit for live non-mock trend data
3. **OAuth provider credentials** — Google/LinkedIn/etc. in Supabase + env
4. **Razorpay live keys** — test mode E2E wired; needs production keys
5. **Admin keywords/platforms** — v2 placeholders
6. **Personalization** — filter trends by `profiles.niches` / `platforms` in `getTrends`
7. **Password reset** — requires Supabase Auth email template configuration
