# Social Connect vs Global Trends (architecture)

Nemo has **two separate pipelines**. Mixing them caused fake “Connected” states and empty Trends.

## 1) Social Connect (per-user OAuth)

- **UI:** Settings → Social Connect  
- **Purpose:** Link *your* Google / YouTube / Instagram / LinkedIn / X for later personalization  
- **Storage:** `user_connections.encrypted_tokens` (AES-256-GCM)  
- **Required env:** `CONNECTIONS_ENCRYPTION_KEY` + per-provider `*_CLIENT_ID` / `*_CLIENT_SECRET`  
- **Rule:** Connect succeeds only after a real `code → token` exchange. Tokens never go to the browser.

Generate encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add on Vercel as `CONNECTIONS_ENCRYPTION_KEY` (Production + Preview).

## 2) Global Trends (app-level collectors + cron)

- **UI:** Dashboard Trends  
- **Purpose:** Platform-wide rising topics for all users  
- **Does not read** `user_connections`  
- **Required env (phased):**
  - Reddit — none (public JSON)
  - `YOUTUBE_API_KEY`
  - `SERPAPI_KEY` (or `GOOGLE_TRENDS_PROXY_URL`)
  - Later: `INSTAGRAM_ACCESS_TOKEN`, `LINKEDIN_ACCESS_TOKEN`, `TWITTER_BEARER_TOKEN`, TikTok partner keys
- **Schedule:** Vercel cron `/api/trends/ingest` every 6 hours (`vercel.json`)
- **Stale cleanup:** After a successful ingest, records older than ~72h that were not refreshed are purged

## What you are collecting now

When you finish platform developer apps / API packages, share them and we wire **final collectors** without changing this architecture.

Until then:

1. Paste **collector** keys (`YOUTUBE_API_KEY`, `SERPAPI_KEY`) when ready → Trends light up  
2. Paste **OAuth** client IDs/secrets + `CONNECTIONS_ENCRYPTION_KEY` when ready → Connect works for real  
3. Keep paid Razorpay / public prices deferred until market launch
