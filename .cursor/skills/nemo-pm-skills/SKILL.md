---
name: nemo-pm-skills
description: Curated PM skills index for building Nemo — trend intelligence SaaS for creators, marketers, and agencies. Use when prioritizing MVP gaps, writing specs, pricing/GTM, metrics, or shipping auth/billing/collectors safely. Routes to 30 skills from phuryn/pm-skills installed in ~/.cursor/skills/.
---

# Nemo PM Skills

Curated subset of [phuryn/pm-skills](https://github.com/phuryn/pm-skills) for Nemo development. Full library (111 skills) lives in `~/.cursor/skills/`. Read the matching `SKILL.md` before executing any workflow or framework.

## When to use this index

- Prioritizing MVP backlog against [NEMO_PLATFORM_AUDIT.md](../../../NEMO_PLATFORM_AUDIT.md)
- Writing PRDs for onboarding, OAuth, collectors, or plan gating
- Defining North Star metrics, pricing, or launch plan
- Pre-production security/ship checks on Next.js + Supabase + Razorpay code

---

## Quick routing

| Nemo task | Skill / workflow | Example prompt |
|-----------|------------------|----------------|
| Prioritize MVP gaps | `triage-requests` | "Triage our MVP backlog using MoSCoW" |
| Rank features (RICE/ICE) | `prioritize-features` | "Prioritize TikTok collector vs OAuth vs snapshot pipeline" |
| Choose prioritization method | `prioritization-frameworks` | "Which framework fits our 50-item backlog?" |
| Write a feature spec | `write-prd` or `create-prd` | "Write a PRD for the trend snapshot pipeline" |
| Break spec into stories | `write-stories` | "Break onboarding wizard into user stories" |
| Map risky assumptions | `identify-assumptions-existing` | "What are our riskiest assumptions about social connect?" |
| Rank assumptions to test | `prioritize-assumptions` | "Prioritize assumptions for Nemo Score accuracy" |
| Design validation tests | `brainstorm-experiments-existing` | "Design a fake-door test for Pro reports" |
| Problem → solution → experiment | `opportunity-solution-tree` | "Build an OST for activation drop-off after onboarding" |
| Define metrics dashboard | `setup-metrics` or `metrics-dashboard` | "Design metrics for WAU, AI usage, and upgrades" |
| Pre-MVP code checklist | `ship-check` | "Run ship-check on auth and billing routes" |
| Security audit | `security-audit-static` | "Audit OAuth tokens, Razorpay webhook, Supabase RLS" |
| Spec vs built gap analysis | `intended-vs-implemented` | "Compare scoring spec to src/lib/signals/" |
| Add tests for core logic | `derive-tests` | "Derive tests for scoring engine and collectors" |
| Value proposition / JTBD | `value-proposition` | "Define JTBD for creators vs agencies" |
| User personas | `user-personas` | "Create personas for our three segments" |
| Ideal customer profile | `ideal-customer-profile` | "Define ICP for first paying customers" |
| Pick beachhead segment | `beachhead-segment` | "Which segment should we launch to first?" |
| Competitor landscape | `competitor-analysis` | "Analyze vs Exploding Topics and manual Google Trends" |
| Pricing tiers validation | `pricing` or `pricing-strategy` | "Validate Free/Pro/Agency tiers and AI limits" |
| North Star metric | `north-star` or `north-star-metric` | "Pick a North Star for Nemo at launch" |
| Landing / positioning copy | `market-product` | "Positioning lines for landing page hero" |
| Launch coordination | `plan-launch` | "Plan launch for pricing, onboarding, digest emails" |
| Retention by cohort | `analyze-cohorts` | "Analyze weekly retention by connected platforms" |
| Privacy policy (OAuth data) | `privacy-policy` | "Draft privacy policy for OAuth and niche data" |

---

## Audit-gap mapping

Maps open Nemo gaps to the PM skill that best addresses them. Cross-reference [NEMO_PLATFORM_AUDIT.md](../../../NEMO_PLATFORM_AUDIT.md).

| Gap area | Audit priority | Relevant skills | Skill path |
|----------|----------------|-----------------|------------|
| **Onboarding wizard** (4 steps: niches, platforms, social, schedule) | Must Have | `write-prd`, `write-stories`, `user-stories` | `pm-workflows/write-prd`, `pm-workflows/write-stories`, `user-stories` |
| **OAuth / social connect** (mandatory connect, token storage, settings tab) | Must Have | `write-prd`, `identify-assumptions-existing`, `security-audit-static` | `pm-workflows/write-prd`, `identify-assumptions-existing`, `pm-workflows/security-audit-static` |
| **Data pipeline / collectors** (Google, YouTube, Reddit live; TikTok/Twitter missing; snapshot velocity) | Must Have | `write-prd`, `prioritize-features`, `brainstorm-experiments-existing`, `derive-tests` | `pm-workflows/write-prd`, `prioritize-features`, `brainstorm-experiments-existing`, `pm-workflows/derive-tests` |
| **Plan gating** (Free 5 / Pro 100 / Agency 10k AI angles, upgrade prompts) | Must Have | `write-prd`, `pricing`, `pricing-strategy`, `brainstorm-experiments-existing` | `pm-workflows/write-prd`, `pm-workflows/pricing`, `pricing-strategy` |
| **Trend snapshot pipeline** (velocity deltas, `raw_platform_data` persistence) | Must Have | `write-prd`, `opportunity-solution-tree`, `intended-vs-implemented` | `pm-workflows/write-prd`, `opportunity-solution-tree`, `intended-vs-implemented` |
| **Supabase production** (migrations, RLS, auth) | Must Have | `ship-check`, `security-audit-static`, `write-query` | `pm-workflows/ship-check`, `pm-workflows/security-audit-static`, `sql-queries` |
| **Pricing / checkout / Razorpay** | Must Have | `pricing`, `write-prd`, `pre-mortem` (via red-team) | `pm-workflows/pricing`, `pm-workflows/write-prd` |
| **Scoring accuracy** (Nemo Score, status badges PEAKING/PREDICTED) | Must Have | `intended-vs-implemented`, `brainstorm-experiments-existing`, `derive-tests` | `intended-vs-implemented`, `brainstorm-experiments-existing`, `pm-workflows/derive-tests` |
| **Explore / heatmap / reports** | Should Have | `prioritize-features`, `outcome-roadmap` | `prioritize-features`, `outcome-roadmap` |
| **Launch readiness** | Pre-launch | `plan-launch`, `ship-check`, `north-star`, `market-product` | `pm-workflows/plan-launch`, `pm-workflows/ship-check`, `pm-workflows/north-star`, `pm-workflows/market-product` |
| **Post-launch growth** | Post-MVP | `analyze-cohorts`, `growth-loops`, `analyze-feedback` | `pm-workflows/analyze-cohorts`, `growth-loops`, `pm-workflows/analyze-feedback` |

---

## Curated skills (30)

### Workflows (12)

Read from `~/.cursor/skills/pm-workflows/<name>/SKILL.md`:

| Workflow | Phase | Nemo use |
|----------|-------|----------|
| `triage-requests` | MVP | MoSCoW backlog triage |
| `write-prd` | MVP | Spec blockers (onboarding, pipeline, gating) |
| `write-stories` | MVP | Backlog items from PRDs |
| `setup-metrics` | MVP / launch | North Star + input metrics |
| `ship-check` | MVP | Pre-prod code review |
| `security-audit-static` | MVP | OAuth, API keys, webhooks, RLS |
| `derive-tests` | MVP | Scoring, collectors, billing tests |
| `pricing` | Launch | Free/Pro/Agency validation |
| `plan-launch` | Launch | Coordinated go-live |
| `market-product` | Launch | Landing and positioning copy |
| `north-star` | Launch | Success metric definition |
| `analyze-cohorts` | Growth | Retention by segment |

### Framework skills (18)

Read from `~/.cursor/skills/<name>/SKILL.md`:

| Skill | Phase | Nemo use |
|-------|-------|----------|
| `prioritize-features` | MVP | Impact vs effort ranking |
| `prioritization-frameworks` | MVP | RICE, ICE, MoSCoW reference |
| `identify-assumptions-existing` | MVP | Social connect, scoring claims |
| `prioritize-assumptions` | MVP | Test priority ranking |
| `brainstorm-experiments-existing` | MVP | Fake doors, onboarding A/B |
| `opportunity-solution-tree` | MVP | Activation, bookmark usage |
| `create-prd` | MVP | PRD template (single framework) |
| `user-stories` | MVP | INVEST stories |
| `metrics-dashboard` | MVP / launch | Dashboard metric design |
| `intended-vs-implemented` | MVP | Spec vs built audits |
| `value-proposition` | Launch | JTBD value prop |
| `user-personas` | Launch | Creator / marketer / agency |
| `ideal-customer-profile` | Launch | First paying segment |
| `beachhead-segment` | Launch | Launch segment choice |
| `competitor-analysis` | Launch | Competitive positioning |
| `pricing-strategy` | Launch | Tier and limit validation |
| `north-star-metric` | Launch | North Star framework |
| `privacy-policy` | Launch | SaaS privacy for OAuth data |

---

## How to invoke

1. Match the user's Nemo task to a row in **Quick routing** or **Audit-gap mapping**.
2. Read the skill's `SKILL.md` from `~/.cursor/skills/` (framework) or `~/.cursor/skills/pm-workflows/` (workflow).
3. Pause at workflow checkpoints; save substantial outputs as markdown in the repo.
4. For skills outside this list, consult `~/.cursor/skills/pm-skills-index/SKILL.md`.

## Deprioritized for Nemo

Skip unless explicitly needed: `brainstorm-ideas-new`, `discover`, `product-name`, resume/grammar toolkit, `dummy-dataset`, `pestle-analysis`, `ansoff-matrix`, `swot-analysis` (investor deck only).
