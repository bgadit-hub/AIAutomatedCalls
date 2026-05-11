# SPEC.md — AI Automated Calls: Full System Specification

> Last updated: 2026-05-11 (Session 6)
> Source of truth for call flow, routes, endpoints, webhook events, provider configs, AI scripts, and integrations.

---

## 1. Product Overview

**AI Automated Calls** is a two-layer platform:

| Layer | What It Does | Who It Serves |
|-------|-------------|---------------|
| **Layer 1 — Self-Selling** | AI calls our own leads, qualifies them, books a demo on our native booking page | Us (acquiring clients) |
| **Layer 2 — Client Delivery** | AI agents deployed for each paying client to handle their inbound/outbound calls | Our clients (dental, real estate, HVAC, law, med spa) |

**Domain:** aiautomatedcalls.com
**Repo:** github.com/bgadit-hub/AIAutomatedCalls
**Deploy:** Cloudflare Pages (frontend + API functions)
**Logo:** `assets/logos/logo-main.png`

---

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 18 + Vite | Single JSX file: `src/AIAutomatedCalls.jsx` |
| Hosting | Cloudflare Pages | Auto-deploys from main branch |
| Database | Supabase / Postgres | Project ID: `tkqxwgmkqfusyzrdgacz`, region: us-east-1 |
| Auth | Supabase Auth | Email/password, session persistence |
| API Proxy | Cloudflare Pages Functions | `functions/api/` |
| Voice / AI Calls | **Vapi** | ✅ Live — account provisioned |
| Voice Model | ElevenLabs `eleven_flash_v2_5` | ~75ms latency, best for real-time calls |
| Sales Agent Voice | Brian (`nPczCjzI2devNBz1zQrb`) | Layer 1 Sales Closer |
| LLM (calls) | GPT-4o via Vapi | Low-latency, real-time conversation |
| LLM (platform) | Claude (Anthropic) | Ad generation, call analysis, insights |
| Automation | n8n | Lead trigger + post-call processor |
| CRM | GoHighLevel (GHL) | Client management, pipeline, follow-up |
| SMS | Twilio | Post-call confirmations |
| Email | Resend | Post-call summaries, onboarding |
| Phone Numbers | Vapi | 10 free numbers per account. One per client. |
| Calendar | Native booking system | Built-in — no Calendly dependency |
| Calendar Export | iCal (.ics) | Universal — works with Google Cal, Apple, Outlook |
| Calendar Sync | Google Calendar OAuth | ⏳ Deferred to P1 |

---

## 3. Application Routes / Pages

### Marketing Site (public)
| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `MarketingPage` | Hero, how it works, pricing, CTA → lead form |
| `/book` | `BookingPage` | Native booking page — matches marketing style, books demos for us |

### Auth
| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | `LoginPage` | Supabase email/password login |

### Admin Portal (role: `admin`)
| Route | Component | Description |
|-------|-----------|-------------|
| `/admin` | `AdminDashboard` | Revenue metrics, clients, call volume |
| `/admin/clients` | `ClientList` | All client accounts |
| `/admin/clients/:id` | `ClientDetail` | Client detail — agent, calls, billing |
| `/admin/leads` | `LeadPipeline` | Kanban: New → Called → Qualified → Demo Booked → Closed |
| `/admin/agents` | `AgentMonitor` | All Vapi agents, status, health |
| `/admin/calls` | `CallLog` | All calls across all clients |
| `/admin/revenue` | `RevenueTracker` | MRR, churn, setup fees |
| `/admin/ads` | `SocialAds` | Claude-powered ad generation |

### Client Portal (role: `client`)
| Route | Component | Description |
|-------|-----------|-------------|
| `/portal` | `ClientDashboard` | Call volume, bookings, ROI |
| `/portal/calls` | `CallRecordings` | Recordings, transcripts, AI analysis |
| `/portal/appointments` | `AppointmentCalendar` | Booked appointments |
| `/portal/analytics` | `Analytics` | Conversion rates, missed calls, sentiment |
| `/portal/agent` | `AgentConfig` | View/edit agent script, voice, schedule |
| `/portal/availability` | `AvailabilityManager` | Set days/hours/buffer/appointment types for native booking |
| `/portal/billing` | `Billing` | Plan, invoices, upgrade |

### Onboarding
| Route | Component | Description |
|-------|-----------|-------------|
| `/onboarding` | `OnboardingWizard` | Industry → use case → script → availability → deploy |

---

## 4. Provider Configurations

### Vapi ✅ Live
- **API Base:** `https://api.vapi.ai`
- **Auth:** Bearer `VAPI_API_KEY`
- **Sales Closer Agent ID:** stored in `VAPI_SALES_AGENT_ID`
- **Phone Number ID:** stored in `VAPI_PHONE_NUMBER_ID`
- **Per-client agents:** One agent created via API on onboarding completion
- **Inbound:** Vapi number per client receives calls directly
- **Outbound:** Layer 1 sales calls via Vapi REST API
- **Free numbers:** 10 per account. One provisioned per client.
- **Webhooks:** See §8

### Voice Configuration
- **Model:** `eleven_flash_v2_5` (ElevenLabs Flash — lowest latency, ~75ms)
- **Layer 1 voice:** Brian — ID: `nPczCjzI2devNBz1zQrb`
- **Layer 2 voices:** Client selects from ElevenLabs voice library during onboarding
- **Stability:** 0.5 | **Similarity Boost:** 0.75
- **Why Flash over Turbo/Multilingual:** ElevenLabs confirms Flash has lower latency in all use cases. Sub-100ms critical for natural phone conversations.

### Native Booking System
- **Purpose:** Replace Calendly dependency — fully owned booking for both Layer 1 (our demos) and Layer 2 (client appointments)
- **Public booking URL:** `aiautomatedcalls.com/book` (our demos) | `aiautomatedcalls.com/book/[slug]` (client pages)
- **Style:** Matches marketing site (white bg, teal #1FA8A0 accent)
- **iCal:** `.ics` file generated on every booking, attached to confirmation email
- **Google Calendar sync:** ⏳ Deferred to P1 — OAuth2 integration planned
- **Availability:** Managed per client in `/portal/availability`
- **Tables:** `availability`, `booking_settings`, `appointments`

### Twilio
- **Purpose:** SMS post-call confirmations
- **SMS:** Post-call confirmations via Twilio Messaging API
- **Note:** Phone numbers now provisioned via Vapi (not Twilio) for call handling

### Supabase
- **Project ID:** `tkqxwgmkqfusyzrdgacz`
- **URL:** `https://tkqxwgmkqfusyzrdgacz.supabase.co`
- **RLS:** Enabled on all tables. `admin` sees all. `client` sees own rows.
- **Realtime:** Subscriptions on `calls` table

### n8n
- **Workflow 1:** Lead form submit → wait 45s → Vapi outbound call
- **Workflow 2:** Vapi webhook → Claude analysis → GHL → Twilio SMS → Resend

### GoHighLevel
- Contact created on lead form submit
- Stage updated after every call outcome
- Follow-up sequences for unqualified leads

### Claude API
- **Purpose:** Ad generation, post-call analysis, insights
- **Proxy:** `functions/api/generate-ad.js`
- **Model:** `claude-sonnet-4-20250514`

---

## 5. Layer 1 — Self-Selling Call Flow

```
TRIGGER: Lead submits form on aiautomatedcalls.com
  Fields: name, phone, business_type, pain_point

    ↓ (immediate)

Supabase: INSERT into leads
GHL: Create contact, stage = "New Lead"
n8n Workflow 1: triggered via Supabase webhook

    ↓ (45-second delay)

Vapi: POST /call — outbound to lead's phone
  Agent: Sales Closer (Brian / eleven_flash_v2_5 / GPT-4o)
  Goal: qualify → book demo at aiautomatedcalls.com/book

    ↓ (call ends — Vapi webhook fires)

OUTCOMES:
  ├── qualified + booked   → status='demo_booked', .ics email + SMS confirmation
  ├── qualified + no book  → status='qualified', GHL follow-up sequence
  ├── not qualified        → status='disqualified', nurture tag
  ├── voicemail            → status='voicemail', SMS sent, retry 4h (max 3x)
  └── no answer            → status='no_answer', retry 2h (max 3x)
```

---

## 6. Layer 2 — Client Agent Call Flow

```
TRIGGER: Someone calls the client's Vapi number
    ↓
Vapi routes to client's agent
    ↓
Vapi handles: greeting, use case logic, real-time tool calls, escalation
    ↓ (call ends)
Post-call:
  - Transcript + recording → Supabase
  - Claude analysis: outcome, sentiment, missed opportunities
  - .ics confirmation → caller email
  - SMS confirmation → caller phone (Twilio)
  - Email notification → client (Resend)
  - Dashboard updated (Supabase Realtime)
```

---

## 7. Client Onboarding Flow

```
Step 1: Business Info      — industry, name, address, hours, website
Step 2: Use Case           — booking / lead qual / FAQ / reception / outbound
Step 3: Agent Config       — voice selection, greeting script, knowledge base, escalation number
Step 4: Availability Setup — days available, hours, appointment types, buffer time, timezone
Step 5: Phone Number       — Vapi number auto-provisioned (free from pool)
Step 6: Deploy             — Vapi agent created via API, number assigned, dashboard live, welcome email sent
```

---

## 8. Vapi Webhook Events

Endpoint: `https://aiautomatedcalls.com/api/vapi-webhook`
Handler: `functions/api/vapi-webhook.js` — **must be idempotent**
Auth: verify `x-vapi-secret` header matches `VAPI_WEBHOOK_SECRET` env var

| Event | Action |
|-------|--------|
| `call.started` | INSERT into `calls` (or update if exists), status = 'in_progress' |
| `call.ended` | Update status, duration, recording URL, cost |
| `transcript.ready` | Save to `call_transcripts`, trigger Claude analysis via n8n |
| `tool.called` | Route to correct handler: check_availability, book_appointment, qualify_lead, transfer_to_human |
| `transfer.initiated` | Update call status = 'transferred', log escalation number |
| `voicemail.detected` | Update status = 'voicemail', set voicemail_left = true, trigger follow-up |

---

## 9. Cloudflare Functions

| Function | Status | Purpose |
|----------|--------|--------|
| `functions/api/generate-ad.js` | ✅ Built | Claude ad generation |
| `functions/api/submit-lead.js` | ❌ Not built | Form → Supabase → n8n → Vapi |
| `functions/api/vapi-webhook.js` | ❌ Not built | All Vapi event handling |
| `functions/api/check-availability.js` | ❌ Not built | Vapi tool call — query availability |
| `functions/api/book-appointment.js` | ❌ Not built | Vapi tool call — create booking + .ics |
| `functions/api/generate-ical.js` | ❌ Not built | Generate .ics file for email attachment |

---

## 10. Vapi Tool Calls (Real-Time)

| Tool | Endpoint | Used By |
|------|----------|---------|
| `check_availability` | `POST /api/check-availability` | All booking agents |
| `book_appointment` | `POST /api/book-appointment` | All booking agents |
| `lookup_client_info` | Supabase direct query | All agents |
| `transfer_to_human` | Vapi transfer API | All agents (escalation) |
| `qualify_lead` | `POST /api/submit-lead` (update) | Layer 1 sales agent |
| `book_demo` | `POST /api/book-appointment` with client_id = null (our account) | Layer 1 only |

---

## 11. Agent Scripts

### Layer 1 — Sales Closer (Brian / eleven_flash_v2_5)
```
First Message:
"Hi, this is Alex from AI Automated Calls — you just requested info about our
AI receptionist service. Is now a good time for a quick 2 minutes?"

Qualify:
- "What kind of business do you run?"
- "Are you currently missing calls when you're with clients or after hours?"
- "Have you looked into any solutions for this before?"

Bridge:
"We set up an AI that answers every call for your business 24/7 — books
appointments, handles FAQs, qualifies leads. Most clients see results within 30 days."

CTA:
"I'd love to show you exactly how it would work for a [their industry].
I have a 20-minute slot available — I can send you a link to pick a time.
What's the best email to send that to?"

Voicemail:
"Hi [name], this is Alex from AI Automated Calls. You reached out about our
AI receptionist service — call us back or book a demo at aiautomatedcalls.com/book. Talk soon."
```

### Layer 2 — Industry Templates

| Industry | Style | Primary Use Case |
|----------|-------|------------------|
| Dental | Warm, professional | Appointment booking + recall |
| Real Estate | Energetic | Lead qual + showing booking |
| HVAC | Friendly, urgent | Service booking + emergency routing |
| Law Firm | Formal, empathetic | Intake + consultation booking |
| Med Spa | Warm, aspirational | Treatment booking |
| Chiro | Friendly | Appointment + new patient intake |

---

## 12. Pricing

| Tier | Setup | Monthly | Included |
|------|-------|---------|----------|
| Starter | $750 | $1,200/mo | 1 agent, 500 mins, basic analytics, SMS |
| Standard | $1,500 | $2,000/mo | 1 agent, 1,500 mins, full analytics, CRM, email |
| Premium | $2,500 | $3,000/mo | 2 agents, unlimited mins, AI insights, priority support |

**Target:** 5–8 Standard clients = $10–16K MRR = $300–500/day net
**Cost/min estimate:** ~$0.15–0.20/min all-in (Vapi + ElevenLabs Flash + GPT-4o + Twilio)
**Gross margin at Standard:** ~85% on retainer after provider costs

---

## 13. Environment Variables

| Variable | Used By | Status |
|----------|---------|--------|
| `VITE_SUPABASE_URL` | Frontend | ✅ Set |
| `VITE_SUPABASE_ANON_KEY` | Frontend | ✅ Set |
| `ANTHROPIC_API_KEY` | CF Function | ✅ Set |
| `VAPI_API_KEY` | CF Function + n8n | ✅ Set |
| `VAPI_PHONE_NUMBER_ID` | CF Function | ✅ Set |
| `VAPI_SALES_AGENT_ID` | CF Function + n8n | ✅ Set |
| `VAPI_WEBHOOK_SECRET` | CF Function | ❌ Not set — generate random string |
| `TWILIO_ACCOUNT_SID` | CF Function | ❌ Not set |
| `TWILIO_AUTH_TOKEN` | CF Function | ❌ Not set |
| `TWILIO_FROM_NUMBER` | CF Function | ❌ Not set |
| `GHL_API_KEY` | n8n | ❌ Not set |
| `RESEND_API_KEY` | CF Function | ❌ Not set |
| `N8N_WEBHOOK_SECRET` | n8n | ❌ Not set |
