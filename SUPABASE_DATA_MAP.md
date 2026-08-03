# SUPABASE_DATA_MAP

**Project (MCP):** live staging connected via `user-supabase`  
**Migrations in repo:** `001` … `009`  
**Audit date:** 2026-08-04

## Live tables vs RLS (MCP `execute_sql`)

| Table | RLS enabled | Policy count | Notes |
|---|---|---|---|
| profiles | true | 3 | own-row; `is_admin` column present |
| trend_records | true | 2 | public/auth read; writes via service role path |
| platform_velocity_baselines | true | 2 | read; service writes |
| trend_snapshots | true | 1 | authenticated read |
| trend_bookmarks | true | 1 | own-row ALL |
| queue_items | true | 1 | own-row ALL |
| api_keys | true | 1 | own-row ALL (hash storage expected) |
| user_connections | true | 1 | own-row; **no raw OAuth tokens stored today** (status flags only); GET sanitized via `sanitizeConnectionMetadata`; encrypt-at-rest when credentials are persisted |
| user_events | true | 2 | analytics; IP/UA PII; 90d retention fn |
| user_sessions | true | 3 | analytics; 90d retention fn |
| saved_scripts | true | 1 | own-row |
| ai_generations | true | 2 | own read/insert; no prompt/completion required |
| collector_runs | true | 1 | authenticated read; service write |
| trend_feedback | true | 1 | own-row |
| search_queries | true | 2 | own insert/read; 90d retention |
| notification_prefs | true | 1 | own-row |
| billing_orders | true | 1 | users SELECT own; writes service_role |
| billing_webhook_events | true | 0 | **intentional** service_role-only (RLS on, no client policies) |

## Migration inventory

| File | Purpose |
|---|---|
| `001_nemo_schema.sql` | profiles, trend_records, baselines, handle_new_user |
| `002_user_data.sql` | bookmarks, queue, api_keys, connections |
| `003_trend_snapshots.sql` | snapshots + read policy |
| `004_user_analytics.sql` | user_events, user_sessions |
| `005_profiles_status.sql` | profile status |
| `006_rls_trends.sql` | trend/baseline RLS |
| `007_product_tables.sql` | scripts, ai_generations, collector_runs, feedback, search, notif prefs |
| `008_p0_security_billing_ai.sql` | is_admin, billing_orders, webhook events, `increment_ai_usage` |
| `009_analytics_retention.sql` | `purge_analytics_older_than_90_days()` (**applied via MCP**) |

## Application `.from('table')` map

| Table | Primary call sites |
|---|---|
| profiles | AuthContext, middleware, usage, signup, billing*, admin*, user/profile, oauth callback |
| trend_records | trends/store, trends/persist |
| trend_snapshots | trends/persist |
| platform_velocity_baselines | (migrations / collectors baselines) |
| trend_bookmarks | api/bookmarks* |
| queue_items | api/queue |
| api_keys | api/api-keys*, admin/api-keys* |
| user_connections | user/connections, oauth callback, admin dashboard/metrics |
| user_events | analytics/track, admin*, analytics/summary |
| user_sessions | analytics/track, admin/dashboard |
| saved_scripts | api/scripts* |
| ai_generations | lib/ai/logGeneration |
| collector_runs | trends/store |
| trend_feedback | api/trends/[id]/feedback |
| search_queries | api/analytics/search |
| notification_prefs | api/user/notification-prefs |
| billing_orders | billing/create-order, verify-payment, webhook |
| billing_webhook_events | billing/webhook |

## Personal data & retention

| Data | Retention | Mechanism |
|---|---|---|
| Account / profile / user content | Until account delete | `DELETE /api/user/account` → `auth.admin.deleteUser` + CASCADE |
| user_events / user_sessions / search_queries | 90 days | `purge_analytics_older_than_90_days()` (service_role) |
| billing_* | Compliance retention | Ops / support |

See `PRIVACY.md`.

## Cascades on account delete

`auth.users` delete cascades to `profiles` and child tables with `REFERENCES ... ON DELETE CASCADE` (bookmarks, queue, scripts, generations, events, sessions, searches, feedback, prefs, connections, billing_orders per migrations). Verify in staging after first delete test.

## Gaps / follow-ups

1. Automated anon / user_A / user_B policy tests in CI  
2. Encrypt OAuth tokens in `user_connections.metadata` **when/if** credential material is stored (today: status flags only + API sanitize)  
3. Schedule `purge_analytics_older_than_90_days` on a cron (Supabase pg_cron or Vercel cron calling a secured admin ops route)  
4. Data export endpoint (portability)  
5. Multi-instance AI rate limit store (Redis / Vercel KV) — current limiter is process-local  
6. Staging Razorpay test-mode checkout + webhook proof with real test keys  
