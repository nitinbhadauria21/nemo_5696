# Privacy & data retention

Nemo collects the minimum data needed to operate accounts, billing, trend features, and product analytics.

## What we collect

| Category | Examples | Purpose |
|---|---|---|
| Account | email, name, plan, niches, platforms | Auth, personalization |
| Usage | `ai_usage_count`, `ai_generations` metadata (model, success, tokens estimate — **not** prompt/completion text) | Quotas and reliability |
| Product analytics | `user_events`, `user_sessions`, `search_queries` (may include IP and User-Agent) | Product improvement, abuse detection |
| Billing | `billing_orders`, webhook event ids | Payments and refunds |
| Content you create | saved scripts, bookmarks, queue items | Core product features |
| Connections | OAuth connection metadata | Social connect UX |

## Retention

- **Account data**: until the user deletes their account (`DELETE /api/user/account`) or requests erasure.
- **Analytics** (`user_events`, `user_sessions`, `search_queries`): **90 days**. Use SQL function `purge_analytics_older_than_90_days()` (migration `009`) via ops/cron with the service role.
- **Billing records**: retained as required for tax/compliance; contact support for exceptions.

## Legal basis (high level)

- Contract / service delivery for account, billing, and product features.
- Legitimate interest (or consent where required) for product analytics. Configure your region-specific notices before EU/IN public launch.

## User rights

- **Delete account**: Settings → Profile → Danger zone (requires typing `DELETE`).
- **Export**: contact support (structured export can be added as a follow-up).

## Contact

Privacy requests: use the email listed on your production site / `ADMIN_EMAIL` operator mailbox.
