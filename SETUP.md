# AI Automated Calls — Deployment & Setup Guide

This guide takes you from a fresh clone to a fully live system. Follow every step in order.

---

## Prerequisites

- [ ] Cloudflare Pages project connected to `bgadit-hub/AIAutomatedCalls` (auto-deploys from `main`)
- [ ] Supabase project `tkqxwgmkqfusyzrdgacz` (all 17 migrations applied)
- [ ] Vapi account with a purchased phone number
- [ ] n8n Cloud account (or self-hosted)
- [ ] GoHighLevel (GHL) account + API key
- [ ] Anthropic API key
- [ ] Resend account (free tier is fine)

---

## Step 1: Cloudflare Pages Environment Variables

Go to **Cloudflare Dashboard → Pages → AIAutomatedCalls → Settings → Environment Variables**.

Add all of the following under **Production** (and optionally Preview):

| Variable | Where to find it | Required? |
|----------|------------------|-----------|
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL | ✅ Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/public key | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key | ✅ Yes |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys | ✅ Yes |
| `VAPI_API_KEY` | Vapi dashboard → Account → API Keys | ✅ Yes |
| `VAPI_PHONE_NUMBER_ID` | Vapi → Phone Numbers → copy the ID | ✅ Yes |
| `VAPI_SALES_AGENT_ID` | Vapi → Assistants → your sales agent → copy ID | ✅ Yes |
| `VAPI_WEBHOOK_SECRET` | Make up a strong random string (save it — you'll use it in Vapi too) | ✅ Yes |
| `N8N_WEBHOOK_URL` | From Step 3 (n8n) — add after importing workflows | ✅ Yes |
| `N8N_WEBHOOK_SECRET` | Make up a strong random string (same value goes in n8n too) | ✅ Yes |
| `RESEND_API_KEY` | resend.com → API Keys | ⚠️ Optional (enables booking confirmation emails) |
| `RESEND_FROM` | e.g. `appointments@yourdomain.com` | ⚠️ Optional (requires verified domain in Resend) |

**After adding env vars:** Trigger a new deployment (push any commit, or click "Retry deployment").

---

## Step 2: Create Your Admin User in Supabase

1. Go to **Supabase → Authentication → Users → Invite User**
2. Enter your email address
3. Before clicking Invite, expand **User Metadata** and paste:
   ```json
   { "role": "admin", "full_name": "Your Name" }
   ```
4. Click **Invite**
5. Check your email → click the invite link → set your password
6. Visit `aiautomatedcalls.com` → click **Sign in** → log in with your email/password
7. You should land on the admin dashboard (Overview page)

> The `handle_new_user` trigger auto-creates your `profiles` row with `role: 'admin'`. You can verify in Supabase → Table Editor → profiles.

---

## Step 3: Set Up n8n Workflows

### 3a. Import the Layer 1 Trigger Workflow

1. In n8n, click **+ New Workflow → Import from File**
2. Upload `n8n/LAYER1_TRIGGER_WORKFLOW.json`
3. Open the **Webhook** node — copy the **Production Webhook URL** (looks like `https://your-n8n.app.n8n.cloud/webhook/lead-trigger`)
4. Save this URL — it goes into `N8N_WEBHOOK_URL` in Cloudflare (Step 1)
5. Set up credentials:
   - **Vapi API** — HTTP Header Auth: header `Authorization`, value `Bearer YOUR_VAPI_API_KEY`
   - **Supabase** — HTTP Header Auth: header `apikey`, value your service role key
   - **GHL** — HTTP Header Auth: header `Authorization`, value `Bearer YOUR_GHL_API_KEY`
6. Wire credentials to each HTTP Request node
7. Click **Activate** (toggle at top right)

### 3b. Import the Post-Call Processing Workflow

1. In n8n, click **+ New Workflow → Import from File**
2. Upload `n8n/POSTCALL_WORKFLOW.json`
3. The webhook path is `post-call` — the URL is derived automatically from `N8N_WEBHOOK_URL` by `vapi-webhook.js`
4. Set up credentials (same ones as above, plus Anthropic):
   - **Anthropic API** — HTTP Header Auth: header `x-api-key`, value your Anthropic key
   - Also add a second header: `anthropic-version` = `2023-06-01`
5. Set **n8n Environment Variables** (Settings → Variables):
   - `SUPABASE_URL` = your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = your service role key
   - `N8N_WEBHOOK_SECRET` = same secret as in Cloudflare
6. Replace placeholder `[YOUR_SLACK_WEBHOOK]` with your Slack webhook URL, or delete the Slack node
7. Click **Activate**

---

## Step 4: Configure Vapi Webhook

1. Go to **Vapi Dashboard → Accounts → Webhooks**
2. Set **Server URL**: `https://aiautomatedcalls.com/api/vapi-webhook`
3. Set **Secret**: use the same value as `VAPI_WEBHOOK_SECRET` in Cloudflare
4. Enable events: `call-started`, `end-of-call-report`, `transcript`
5. Save

---

## Step 5: Set Up Your Vapi Sales Agent

1. In Vapi, go to **Assistants → Create Assistant**
2. Configure:
   - **Model**: GPT-4o
   - **Voice**: ElevenLabs → Brian (`eleven_flash_v2_5`)
   - **System prompt**: Your sales script (see below for starter)
3. Save the assistant → copy the **Assistant ID** → add to `VAPI_SALES_AGENT_ID` in Cloudflare

**Starter system prompt:**
```
You are Alex, an AI sales assistant for AI Automated Calls. You're calling local business owners who recently requested information about AI receptionist services.

Your goal: book a 20-minute demo call.

Key talking points:
- We deploy a custom AI voice agent for their business in 48 hours
- It answers all calls 24/7, books appointments, and follows up on leads automatically
- Setup fee from $750, monthly from $1,200
- No contracts, results in 30 days or full refund

Always be friendly, brief, and respect their time. If they're busy, offer to call back.
```

---

## Step 6: Resend Email Setup (Optional but Recommended)

1. Create account at **resend.com**
2. Go to **API Keys → Create API Key** → copy it to `RESEND_API_KEY` in Cloudflare
3. Go to **Domains → Add Domain** → verify your domain with DNS records
4. Set `RESEND_FROM` to `appointments@yourdomain.com` in Cloudflare

Once configured, patients who book via the booking page will automatically receive a professional HTML confirmation email.

---

## Step 7: Onboard Your First Client

1. Log in to `aiautomatedcalls.com` as admin
2. Go to **Clients** → click **Add Client**
3. Fill in: business name, contact name, email, city, tier, monthly retainer
4. Click **Send Login Invite**
5. The client receives an email → they set their password → they log in
6. Their portal is immediately live with their own booking page
7. Share their booking URL: `https://aiautomatedcalls.com/book?client_id=[their-client-uuid]`
   - They find this URL in their **Availability** page after logging in

---

## Step 8: End-to-End Test

### Test the lead capture flow:
1. Go to `aiautomatedcalls.com` (logged out)
2. Fill in the lead capture form with your own number
3. Submit → check Supabase → `leads` table should have a new row
4. Within 60 seconds, Vapi should call your number (if n8n is active)
5. After the call: check `recordings` and `call_transcripts` tables
6. Check admin pipeline — lead should be in the correct stage

### Test the booking flow:
1. Go to `https://aiautomatedcalls.com/book?client_id=[a-real-client-id]`
2. Pick a date and time → fill in patient details → submit
3. Check Supabase → `appointments` table should have a new row
4. If `RESEND_API_KEY` is set and you provided an email, check your inbox
5. Log in as the client → check their **Appointments** page

### Test admin Add Client:
1. Log in as admin → Clients → Add Client
2. Enter a real email you can access
3. Click Send Login Invite → check that email
4. Accept invite → set password → log in
5. Confirm client portal loads with correct data

---

## Troubleshooting

| Issue | Check |
|-------|-------|
| Login shows blank page | Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Cloudflare |
| Add Client returns 403 | `SUPABASE_SERVICE_ROLE_KEY` not set, or user doesn't have `role: 'admin'` in profiles |
| Lead form submits but no call | `N8N_WEBHOOK_URL` not set, or n8n workflow not activated |
| Vapi webhook not firing | Check webhook URL and secret in Vapi dashboard |
| No transcript analysis | Post-call n8n workflow not active, or Anthropic credential missing |
| Booking page shows no slots | Client has no availability set, or `check-availability.js` can't reach Supabase |
| No confirmation email | `RESEND_API_KEY` not set, or patient_email not provided by patient |

---

## Environment Variables Quick Reference

```bash
# Cloudflare Pages — Production env vars
VITE_SUPABASE_URL=https://tkqxwgmkqfusyzrdgacz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
VAPI_API_KEY=vapi_...
VAPI_PHONE_NUMBER_ID=...
VAPI_SALES_AGENT_ID=...
VAPI_WEBHOOK_SECRET=<strong-random-string>
N8N_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook/lead-trigger
N8N_WEBHOOK_SECRET=<strong-random-string>
RESEND_API_KEY=re_...
RESEND_FROM=appointments@yourdomain.com

# n8n Environment Variables (Settings → Variables)
SUPABASE_URL=https://tkqxwgmkqfusyzrdgacz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
N8N_WEBHOOK_SECRET=<same-as-cloudflare>
```

---

## Architecture Overview

```
Marketing Page
    ↓ lead form submit
POST /api/submit-lead (Cloudflare Function)
    ↓ insert into leads
    ↓ fire-and-forget
n8n LAYER1_TRIGGER_WORKFLOW
    ↓ 45s delay
    ↓ Vapi outbound call
Vapi AI Sales Agent
    ↓ call events
POST /api/vapi-webhook (Cloudflare Function)
    ↓ update recordings/transcripts
    ↓ trigger
n8n POSTCALL_WORKFLOW
    ↓ Claude analysis
    ↓ update call_transcripts
    ↓ update leads stage
    ↓ GHL routing

Patient Booking Page (/book)
    ↓ GET /api/check-availability
    ↓ POST /api/book-appointment
    ↓ insert appointments
    ↓ Resend confirmation email

Admin Dashboard
    ↓ POST /api/admin/invite-client
    ↓ Supabase Auth invite
    ↓ create clients row
    ↓ client logs in

Client Portal
    ← live data from Supabase (RLS)
    ← recordings, appointments, availability
```

---

*Last updated: May 2026 · aiautomatedcalls.com*
