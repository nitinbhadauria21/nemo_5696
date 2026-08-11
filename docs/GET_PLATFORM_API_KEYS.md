# Nemo — Get Your Platform API Keys (Simple Guide)

**Who this is for:** You (the founder), even if you are not technical.

**What an API key is:** A secret password that lets Nemo's app ask YouTube, Google Trends, etc. for real data. You create the key on that company's website. You do **not** scrape websites yourself.

---

## Your job vs the agent's job

| You do | The agent (Cursor) does |
|--------|-------------------------|
| Open websites and create accounts | Write the code that uses the keys |
| Copy API keys (secret text strings) | Connect Reddit / YouTube / Trends to the app |
| Paste keys into **Vercel** (or send them in chat) | Fix ingest, scoring, cron, and deploy |
| Tell the agent when keys are ready | Run **Phase A / B / C** from the real-trends plan |

You do **not** need to "fetch trends" yourself. Creating keys + pasting them is enough.

**Name note:** For Google Trends we use **SerpAPI** (one word, capital S and A). It is **not** "Scrap API."

---

## Where to paste keys (Vercel)

Do this for every new key:

1. Open https://vercel.com and sign in.
2. Open your project (**nemo-5696**).
3. Go to **Settings** → **Environment Variables**.
4. Click **Add** (or **Create**).
5. **Name** = the exact name from this guide (example: `YOUTUBE_API_KEY`).
6. **Value** = paste the key you copied.
7. Select **Production** and **Preview** (both).
8. Save.

Or: send the name + value in chat with the agent, and ask them to help put it on Vercel.

Always use **Production + Preview** so live site and preview deploys both work.

---

## Part 0b — Social Connect encryption (one-time)

Social Connect stores OAuth tokens encrypted. Add this **once** on Vercel:

| Name | Value |
|------|--------|
| `CONNECTIONS_ENCRYPTION_KEY` | 64 hex characters (run the command below) |

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

This is **not** a YouTube/SerpAPI key. Without it, Connect fails safely in production instead of faking success.

OAuth client IDs/secrets (`GOOGLE_CLIENT_ID`, etc.) are separate — add those when each platform’s developer app is ready. See `docs/CONNECTIONS_AND_TRENDS.md`.

---

## Part 0 — Confirm what you already have

You should already have these on Vercel from earlier setup:

- Supabase keys (names look like `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- `CRON_SECRET` (a secret used so only our scheduled jobs can refresh trends)

**What to do:**

1. Open Vercel → **nemo-5696** → **Settings** → **Environment Variables**.
2. Look for the Supabase names and `CRON_SECRET`.
3. Tell the agent either:
   - "Yes, Supabase and CRON_SECRET are there," **or**
   - "I don't see them" (and which names are missing).

Do **not** change or delete them unless the agent asks you to.

---

## Part 1 — Reddit (nothing for you to create)

- **No API key needed.**
- The agent will fix the app so Reddit trends can load.
- Your only job later: open the dashboard and check that Reddit topics look real.

Skip ahead to Part 2 for the first key you create.

---

## Part 2 — YouTube Data API key → `YOUTUBE_API_KEY`

**Time:** about 15–30 minutes
**Cost:** free for normal small use (Google gives a free quota)
**Goal:** one environment variable named exactly `YOUTUBE_API_KEY`

### Click-by-click steps

1. Open https://console.cloud.google.com/
2. Sign in with your Google account (Gmail is fine).
3. If Google asks you to accept terms → click **Accept**.
4. At the top, click the project name (or "Select a project") → **New Project**.
5. Project name: `Nemo` → click **Create**.
6. Wait a few seconds, then make sure project **Nemo** is selected in the top bar.
7. In the top search bar, type: **YouTube Data API v3**.
8. Open **YouTube Data API v3** → click **Enable**.
9. Go to **APIs & Services** → **Credentials** (use the left menu, or search for "Credentials").
10. Click **+ Create Credentials** → **API key**.
11. Google shows a long key. Click **Copy**. Keep it private.
12. (Optional but recommended) Click **Edit API key** (or the pencil icon):
    - Under **API restrictions**, choose **Restrict key**.
    - Select only **YouTube Data API v3**.
    - Click **Save**.

### Paste into Vercel

| Name | Value |
|------|--------|
| `YOUTUBE_API_KEY` | *(paste the key you copied)* |

Environments: **Production** + **Preview** → Save.

Then message the agent: **"YouTube key is on Vercel."**

---

## Part 3 — SerpAPI for Google Trends → `SERPAPI_KEY`

Google does **not** give a simple free "Trends API" button.
Easiest path for you: **SerpAPI** — a service that fetches Google Trends data for Nemo.

**Time:** about 20–40 minutes
**Cost:** may need a small paid plan after free credits run out (needed for reliable Trends)
**Goal:** one environment variable named exactly `SERPAPI_KEY`

### Click-by-click steps

1. Open https://serpapi.com/
2. Click **Register** / **Sign up** (email or Google login).
3. Confirm your email if they ask.
4. Open your **Dashboard**.
5. Find **API Key** → click **Copy**.
6. Check free credits. If the free plan is empty or too small, add a small paid plan so Trends stay reliable.

### Paste into Vercel

| Name | Value |
|------|--------|
| `SERPAPI_KEY` | *(paste your SerpAPI key)* |

Environments: **Production** + **Preview** → Save.

Then message the agent: **"SerpAPI key is on Vercel."**

**Optional note:** If you already have another Trends proxy URL instead of SerpAPI, the agent can use `GOOGLE_TRENDS_PROXY_URL`. For most founders, **SerpAPI + `SERPAPI_KEY` is simpler.**

---

## Part 4 — Later platforms (skip for now)

Do **not** start these for the first demo. Reddit + YouTube + SerpAPI is enough to show real trends.

When you have spare time later:

| Platform | Where you sign up | What you'll eventually give the agent |
|----------|-------------------|----------------------------------------|
| Instagram / Facebook | https://developers.facebook.com/ | Meta app + access tokens (harder; often needs a Business Instagram) |
| LinkedIn | https://www.linkedin.com/developers/ | Client ID, Client Secret, and access token |
| X (Twitter) | https://developer.x.com/ | Bearer token (usually **paid**) |
| TikTok | TikTok for Developers / data partners | Special approval (**slow**) |

**Skip these for now.**

---

## Printable checklist

Copy this and tick items as you go:

```text
[ ] Checked Vercel has Supabase keys + CRON_SECRET (yes / no: ____)
[ ] Created Google Cloud project "Nemo"
[ ] Enabled YouTube Data API v3
[ ] Created YouTube API key
[ ] Added YOUTUBE_API_KEY on Vercel (Production + Preview)
[ ] Signed up on SerpAPI (https://serpapi.com/)
[ ] Added SERPAPI_KEY on Vercel (Production + Preview)
[ ] Told the agent: keys are ready (which ones)
```

Suggested order: **Part 0 → Part 2 (YouTube) → Part 3 (SerpAPI)**. Reddit needs no key.

---

## Safety tips

1. Treat API keys like passwords. Do not post them in public Tweets, LinkedIn, or WhatsApp groups.
2. Sharing with the agent in Cursor chat, or pasting only into Vercel, is OK.
3. If a key ever leaks, go back to Google Cloud or SerpAPI, **delete** the old key, create a new one, and update Vercel.
4. Prefer restricting the YouTube key to **YouTube Data API v3** only (Part 2, step 12).

---

## What to message the agent when you are done

Send a short message like one of these:

- **"YouTube key is on Vercel."**
- **"SerpAPI key is on Vercel."**
- **"Keys are on Vercel: YOUTUBE_API_KEY and SERPAPI_KEY."**
- If something is missing: **"Supabase / CRON_SECRET — I don't see them."**

If you want coding to start on Reddit while you still create YouTube keys, you can also say: **"Start Phase A now."**

---

## What happens next (agent work)

After keys are ready (or you ask to start Reddit-only), the agent runs the **real trends plan** in phases:

- **Phase A** — Foundation + Reddit (no key from you)
- **Phase B** — YouTube live data (needs your `YOUTUBE_API_KEY`)
- **Phase C** — Google Trends via SerpAPI (needs your `SERPAPI_KEY`)

Then the agent deploys. You open the live dashboard (for example https://nemo-5696.vercel.app/dashboard) and check that **new, real** topics appear.

---

**Start with Part 2 (YouTube) today.** When that key is on Vercel, message the agent. Then do SerpAPI when you can.

Remember: you create **API keys / accounts**. You are **not** scraping platforms yourself. The correct Trends provider name is **SerpAPI**.
