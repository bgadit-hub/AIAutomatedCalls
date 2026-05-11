# AI Automated Calls

> AI voice receptionist agency platform — deploy AI phone agents for local businesses on monthly retainers

**Stack:** React 18 · Vite · Supabase · Retell AI · Claude API · n8n · GoHighLevel · Twilio · Cloudflare Pages

---

## Quick Start

```bash
git clone https://github.com/bgadit-hub/aiautomatedcalls.git
cd aiautomatedcalls
npm install
cp .env.example .env.local
# Fill in VITE_SUPABASE_ANON_KEY (URL is already set)
npm run dev
```

## Supabase

| | |
|---|---|
| Project ID | `tkqxwgmkqfusyzrdgacz` |
| URL | `https://tkqxwgmkqfusyzrdgacz.supabase.co` |
| Dashboard | https://supabase.com/dashboard/project/tkqxwgmkqfusyzrdgacz |

Migrations already applied (schema + RLS + seed data). Just grab your anon key from Project Settings → API.

## Structure

```
src/AIAutomatedCalls.jsx   React app — 14 pages, admin + client portals
src/main.jsx               Entry with AuthProvider
src/lib/supabase.js        Supabase client
src/lib/api.js             All data fetching
src/hooks/useAuth.js       Auth context
supabase/schema.sql        DB schema, RLS, seed data
n8n/                       Workflow JSONs (import into n8n)
retell/                    AI voice agent prompt + knowledge base
outreach/                  Cold email sequences + Apollo templates
ghl/                       GoHighLevel setup guide
site/LANDING_PAGE.html     aiautomatedcalls.com landing page
functions/api/generate-ad.js  Cloudflare Pages Function (Claude API proxy)
MASTER_SETUP_GUIDE.md      Day-by-day launch plan
```

## Revenue Model

| Tier | Setup | Monthly | Niche |
|------|-------|---------|-------|
| Starter | $750 | $1,200 | HVAC, plumbing, chiro |
| Standard | $1,500 | $2,000 | Dental, law, real estate |
| Premium | $2,500 | $3,000 | Med spa, multi-location |

Target: 5–8 Standard clients = $10–16K MRR = $300–500/day net profit

## Deploy to Cloudflare Pages

```bash
npm run build
```

Connect repo in Cloudflare Pages dashboard, set env vars:
- `VITE_SUPABASE_URL` = `https://tkqxwgmkqfusyzrdgacz.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = from Supabase dashboard
- `ANTHROPIC_API_KEY` = your Claude API key

The `functions/api/generate-ad.js` file is picked up automatically by Cloudflare Pages Functions.

## Placeholders to Replace

Search the repo for these before launch:

- `[YOUR_RETELL_AGENT_ID]` — Retell AI dashboard → your agent ID
- `[YOUR_STRIPE_LINK]` — Stripe payment links
- `[LOOM_EMBED_ID]` — your demo video Loom ID
- `[YOUR_BOOKING_LINK]` — Calendly or GHL calendar
- `[DEMO_PHONE]` — your Twilio demo line number
