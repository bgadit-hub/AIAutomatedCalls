# OPS.md — AI Automated Calls: Operations & Session Log

> Last updated: 2026-05-11 (Session 6)

---

## System Status

| Component | Status | Notes |
|-----------|--------|-------|
| Cloudflare Pages | ✅ Live | aiautomatedcalls.pages.dev, auto-deploys from main |
| Supabase DB | ✅ Live | `tkqxwgmkqfusyzrdgacz` — 5 original tables applied |
| Marketing page | ✅ Live | Integrated into React app |
| Login / Auth | ✅ Live | Supabase Auth |
| Admin portal | ✅ Live | 14 pages, light theme, real logo — mock data |
| Client portal | ✅ Live | Stub pages — not yet live data |
| GitHub MCP write | ✅ Working | `github:push_files` via local PAT |
| Vapi account | ✅ Live | Provisioned with credit card |
| Vapi Sales Closer agent | ✅ Created | Brian voice / eleven_flash_v2_5 / GPT-4o |
| Vapi phone number | ✅ Provisioned | 1 of 10 free numbers used |
| Env vars (Vapi) | ✅ Set | VAPI_API_KEY, VAPI_SALES_AGENT_ID, VAPI_PHONE_NUMBER_ID |
| Retell AI | 🔄 Archiving | Replaced by Vapi |
| n8n workflows | ⚠️ Partial | Need Vapi update |
| GoHighLevel | ⚠️ Config only | API key not in env vars |
| Twilio | ⚠️ Not started | SMS only (calls now on Vapi) |
| Native booking system | 🔴 Not built | Replacing Calendly |
| submit-lead.js | 🔴 Not built | P0 — marketing form → Vapi call |
| vapi-webhook.js | 🔴 Not built | P0 — all Vapi event handling |
| check-availability.js | 🔴 Not built | Vapi tool call |
| book-appointment.js | 🔴 Not built | Vapi tool call |
| DB migrations (new tables) | 🔴 Not applied | 7 tables pending |
| Live data in dashboards | 🔴 Not built | All showing mock data |
| Post-call Claude analysis | 🔴 Not built | |
| Real-time dashboard | 🔴 Not built | |

---

## P0 — Before First Client
- [ ] DB migrations: agents, call_transcripts, agent_templates, notifications, subscriptions, availability, booking_settings
- [ ] `functions/api/submit-lead.js` — form → Supabase INSERT → n8n → Vapi outbound call
- [ ] `functions/api/vapi-webhook.js` — idempotent, all Vapi events
- [ ] `functions/api/check-availability.js` — Vapi tool call handler
- [ ] `functions/api/book-appointment.js` — Vapi tool call, generates .ics
- [ ] Native booking page `/book` — matches marketing style
- [ ] Client availability manager `/portal/availability`
- [ ] Wire marketing form to submit-lead.js
- [ ] Set VAPI_WEBHOOK_SECRET in Cloudflare env vars

## P1 — Before Scaling
- [ ] Layer 2 inbound call routing (client agents)
- [ ] Client onboarding wizard (6-step, deploys Vapi agent automatically)
- [ ] Supabase Realtime on calls table
- [ ] Post-call Claude analysis (transcript → summary, sentiment, missed opps)
- [ ] Live data wired into all dashboard pages
- [ ] Seed agent_templates (6 industry presets)
- [ ] Google Calendar OAuth sync
- [ ] Twilio SMS post-call confirmations
- [ ] Resend email post-call summaries
- [ ] GHL integration

## P2 — Competitive Moat
- [ ] Multi-agent routing
- [ ] AI call insights ("missed 4 bookings because...")
- [ ] A/B script testing
- [ ] Stripe billing
- [ ] Admin analytics dashboard
- [ ] iCal subscription URL (live feed)

---

## Environment Variables

| Variable | Status |
|----------|---------|
| `VITE_SUPABASE_URL` | ✅ Set |
| `VITE_SUPABASE_ANON_KEY` | ✅ Set |
| `ANTHROPIC_API_KEY` | ✅ Set |
| `VAPI_API_KEY` | ✅ Set |
| `VAPI_PHONE_NUMBER_ID` | ✅ Set |
| `VAPI_SALES_AGENT_ID` | ✅ Set |
| `VAPI_WEBHOOK_SECRET` | ❌ Not set — generate random string |
| `TWILIO_ACCOUNT_SID` | ❌ Not set |
| `TWILIO_AUTH_TOKEN` | ❌ Not set |
| `TWILIO_FROM_NUMBER` | ❌ Not set |
| `GHL_API_KEY` | ❌ Not set |
| `RESEND_API_KEY` | ❌ Not set |
| `N8N_WEBHOOK_SECRET` | ❌ Not set |

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
Switched Retell → Vapi. Dual-product vision documented. Full documentation suite created and pushed.

### Session 6 (2026-05-11)
Vapi account provisioned. Sales Closer agent created (Brian / eleven_flash_v2_5 / GPT-4o). Phone number obtained (1 of 10 free). All 3 Vapi env vars set in Cloudflare. Native booking system decided (replacing Calendly). iCal integration planned. Google Calendar OAuth deferred to P1. Full doc review and update per Thought Process Protocol. 2 new tables added to schema (availability, booking_settings). SPEC, SCHEMA, OPS, ISSUE_LOG, CHANGE_LOG all updated. Ready to build code.
