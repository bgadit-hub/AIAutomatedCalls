# SPEC.md — AI Automated Calls: Full System Specification

> Last updated: 2026-05-11
> Source of truth for call flow, routes, endpoints, webhook events, provider configs, AI scripts, and integrations.

---

## 1. Product Overview

**AI Automated Calls** is a two-layer platform:

| Layer | What It Does | Who It Serves |
|-------|-------------|---------------|
| **Layer 1 — Self-Selling** | AI calls our own leads, qualifies them, books a demo on our calendar | Us (acquiring clients) |
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
| Voice / AI Calls | **Vapi** | Replacing Retell AI |
| LLM (calls) | GPT-4o via Vapi | Low-latency, real-time conversation |
| LLM (platform) | Claude (Anthropic) | Ad generation, call analysis, insights |
| Automation | n8n | Lead trigger + post-call processor |
| CRM | GoHighLevel (GHL) | Client management, pipeline, follow-up |
| SMS | Twilio | Post-call confirmations |
| Email | Resend | Post-call summaries, onboarding |
| Phone Numbers | Twilio | One number provisioned per client |

---

## 3. Application Routes / Pages

### Marketing Site (public)
| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `MarketingPage` | Hero, how it works, pricing, CTA → lead form |

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
| `/portal/calls` | `CallRecordings` | Recordings, transcripts, outcomes |
| `/portal/appointments` | `AppointmentCalendar` | Booked appointments |
| `/portal/analytics` | `Analytics` | Conversion rates, missed calls |
| `/portal/agent` | `AgentConfig` | View/edit agent script, voice, schedule |
| `/portal/billing` | `Billing` | Plan, invoices, upgrade |

### Onboarding
| Route | Component | Description |
|-------|-----------|-------------|
| `/onboarding` | `OnboardingWizard` | Industry → use case → script → calendar → deploy |

---

## 4. Provider Configurations

### Vapi
- **API Base:** `https://api.vapi.ai`
- **Auth:** Bearer `VAPI_API_KEY`
- **Per-client agents:** One agent created via API on onboarding
- **Inbound:** Twilio number per client forwards to their Vapi agent
- **Outbound:** Layer 1 sales calls via Vapi REST API
- **Webhooks:** See §8

### Twilio
- **One number per client:** Provisioned on onboarding, stored in `clients.phone_number`
- **SMS:** Post-call confirmations via Twilio Messaging API

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
n8n Workflow 1: triggered

    ↓ (45-second delay)

Vapi: POST /call — outbound to lead's phone
  Agent: Sales Closer | Goal: qualify → book demo

    ↓ (call ends — Vapi webhook fires)

OUTCOMES:
  ├── qualified + booked   → status='demo_booked', SMS + email
  ├── qualified + no book  → status='qualified', GHL follow-up
  ├── not qualified        → status='disqualified', nurture
  ├── voicemail            → status='voicemail', SMS, retry 4h (max 3x)
  └── no answer            → status='no_answer', retry 2h (max 3x)
```

---

## 6. Layer 2 — Client Agent Call Flow

```
TRIGGER: Someone calls the client's Twilio number
    ↓
Twilio forwards to client's Vapi agent
    ↓
Vapi handles: greeting, use case logic, real-time tool calls, escalation
    ↓ (call ends)
Post-call: transcript + recording → Supabase → Claude analysis → SMS → email → realtime update
```

---

## 7. Client Onboarding Flow

```
Step 1: Business Info     — industry, name, address, hours, website
Step 2: Use Case          — booking / lead qual / FAQ / reception / outbound
Step 3: Agent Config      — voice, greeting script, knowledge base
Step 4: Calendar          — Google Calendar or Calendly
Step 5: Phone Number      — Twilio number auto-provisioned
Step 6: Deploy            — Vapi agent created, number forwarded, dashboard live
```

---

## 8. Vapi Webhook Events

Endpoint: `https://aiautomatedcalls.com/api/vapi-webhook`
Handler: `functions/api/vapi-webhook.js` — **must be idempotent**

| Event | Action |
|-------|--------|
| `call.started` | Insert/update `calls`, status = 'in_progress' |
| `call.ended` | Update status, duration, recording URL |
| `transcript.ready` | Save to `call_transcripts`, trigger Claude analysis |
| `tool.called` | Handle calendar lookup, booking, CRM query |
| `transfer.initiated` | Log escalation, notify client |
| `voicemail.detected` | Log, trigger follow-up |

---

## 9. Vapi Tool Calls (Real-Time)

| Tool | Function | Used By |
|------|----------|---------|
| `check_availability` | Query calendar | Booking agents |
| `book_appointment` | Create calendar event | Booking agents |
| `lookup_client_info` | Pull from Supabase | All agents |
| `transfer_to_human` | Transfer to client's number | All agents |
| `qualify_lead` | Log to Supabase | Layer 1 |
| `book_demo` | Book on our Calendly | Layer 1 only |

---

## 10. Agent Scripts

### Layer 1 — Sales Closer
```
Intro: "Hi, this is Alex from AI Automated Calls — you requested info on our AI
receptionist service. Is now a good time for 2 minutes?"

Qualify: business type, missing calls, tried solutions before

Bridge: "We set up AI that answers every call 24/7 — books appointments,
handles FAQs, qualifies leads. Results within 30 days."

CTA: "I have a 20-minute slot [day] at [time] — does that work?"

Voicemail: "Hi [name], Alex from AI Automated Calls. Call back or book at aiautomatedcalls.com."
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

## 11. Pricing

| Tier | Setup | Monthly | Included |
|------|-------|---------|----------|
| Starter | $750 | $1,200/mo | 1 agent, 500 mins |
| Standard | $1,500 | $2,000/mo | 1 agent, 1,500 mins, CRM, email |
| Premium | $2,500 | $3,000/mo | 2 agents, unlimited mins, AI insights |

**Target:** 5–8 Standard clients = $10–16K MRR = $300–500/day net

---

## 12. Environment Variables

| Variable | Used By |
|----------|---------|
| `VITE_SUPABASE_URL` | Frontend |
| `VITE_SUPABASE_ANON_KEY` | Frontend |
| `ANTHROPIC_API_KEY` | CF Function |
| `VAPI_API_KEY` | CF Function + n8n |
| `VAPI_PHONE_NUMBER_ID` | CF Function |
| `VAPI_SALES_AGENT_ID` | n8n |
| `TWILIO_ACCOUNT_SID` | CF Function |
| `TWILIO_AUTH_TOKEN` | CF Function |
| `TWILIO_FROM_NUMBER` | CF Function |
| `GHL_API_KEY` | n8n |
| `RESEND_API_KEY` | CF Function |
| `N8N_WEBHOOK_SECRET` | n8n |
