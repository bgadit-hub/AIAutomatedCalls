# OPS.md — AI Automated Calls: Operations & Session Log

> Last updated: 2026-05-11

---

## System Status

| Component | Status | Notes |
|-----------|--------|-------|
| Cloudflare Pages | ✅ Live | aiautomatedcalls.pages.dev |
| Supabase DB | ✅ Live | `tkqxwgmkqfusyzrdgacz` |
| Marketing page | ✅ Live | Integrated into React app |
| Login / Auth | ✅ Live | Supabase Auth |
| Admin portal | ✅ Live | 14 pages, light theme, real logo |
| Client portal | ✅ Live | Stub pages, not yet live data |
| GitHub MCP write | ✅ Working | `github:push_files` via local PAT |
| Vapi | ⚠️ Not started | Need account + API key |
| Retell AI | 🔄 Archiving | Replaced by Vapi |
| n8n workflows | ⚠️ Partial | Need Vapi update |
| GoHighLevel | ⚠️ Config only | API key not in env vars |
| Twilio | ⚠️ Not started | |
| Layer 1 call flow | 🔴 Not built | Highest priority |
| Layer 2 delivery | 🔴 Not built | |
| Vapi webhook handler | 🔴 Not built | |
| Post-call analysis | 🔴 Not built | |
| Real-time dashboard | 🔴 Not built | |

---

## P0 — Before First Client
- [ ] Vapi account + API key + create Layer 1 Sales Closer agent
- [ ] Wire marketing form → `submit-lead.js` → Supabase → n8n → Vapi call
- [ ] Build `functions/api/vapi-webhook.js` (idempotent)
- [ ] DB migrations: agents, call_transcripts, agent_templates, notifications, subscriptions
- [ ] Client onboarding wizard (6-step)
- [ ] Twilio number auto-provisioning

## P1 — Before Scaling
- [ ] Layer 2 inbound call routing
- [ ] Supabase Realtime on calls table
- [ ] Post-call Claude analysis (transcript → summary, sentiment, missed opps)
- [ ] Calendar integration (Google + Calendly)
- [ ] Live data in client dashboard
- [ ] Seed agent_templates (6 industries)

## P2 — Competitive Moat
- [ ] Multi-agent routing
- [ ] AI call insights
- [ ] A/B script testing
- [ ] Stripe billing
- [ ] Admin analytics dashboard

---

## Environment Variables

| Variable | Status |
|----------|---------|
| `VITE_SUPABASE_URL` | ✅ Set |
| `VITE_SUPABASE_ANON_KEY` | ✅ Set |
| `ANTHROPIC_API_KEY` | ✅ Set |
| `VAPI_API_KEY` | 🔴 Not set |
| `VAPI_PHONE_NUMBER_ID` | 🔴 Not set |
| `VAPI_SALES_AGENT_ID` | 🔴 Not set |
| `TWILIO_ACCOUNT_SID` | 🔴 Not set |
| `TWILIO_AUTH_TOKEN` | 🔴 Not set |
| `TWILIO_FROM_NUMBER` | 🔴 Not set |
| `GHL_API_KEY` | 🔴 Not set |
| `RESEND_API_KEY` | 🔴 Not set |
| `N8N_WEBHOOK_SECRET` | 🔴 Not set |

---

## Session Log

### Session 1 (~2026-05)
AI Automation Agency model. Stack selected. 3-tier pricing. Target $300–500/day net.

### Session 2 (~2026-05)
Full React app (14 pages), Supabase schema, n8n workflows, Retell prompt, GHL guide, Cloudflare Function.

### Session 3 (~2026-05)
Light theme (teal #1FA8A0). Logo `assets/logos/logo-main.png` integrated.

### Session 4 (~2026-05)
Marketing page integrated as React component. White screen resolved.

### Session 5 (2026-05-11)
Switched Retell → Vapi. Dual-product vision documented (Layer 1 + Layer 2). GitHub MCP write confirmed via local PAT (`github:push_files`). Full documentation suite pushed.
