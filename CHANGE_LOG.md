# CHANGE_LOG.md — AI Automated Calls

---

## 2026-05-11 | DOCS | Session 6 — full doc review and update
**Protocol:** Invoked Thought_Process.md before building. Read all 5 docs from GitHub. Full gap analysis performed.
**Changes:**
- SPEC: Voice config added (Brian/eleven_flash_v2_5), `/book` and `/portal/availability` routes added, native booking system documented, iCal added, Calendly references removed, Google Cal deferred P1, onboarding Step 4 updated, tool calls updated, env var status updated, new functions table added
- SCHEMA: `availability` and `booking_settings` tables added, `calendar_source` updated (native/ical/google), `agents.voice_model` column added, `clients.vapi_number_id` added, migration status table added
- OPS: Vapi marked live, session 6 logged, P0/P1/P2 lists updated, env var status updated
- ISSUE_LOG: ISSUE 7 resolved (C4), ISSUE 9 added (native booking), ISSUE 10 added (Google Cal deferred)
- CHANGE_LOG: this entry

## 2026-05-11 | CONFIG | Vapi account + Sales Closer agent provisioned
Account created, credit card added. Sales Closer agent: Brian voice (`nPczCjzI2devNBz1zQrb`) / `eleven_flash_v2_5` / GPT-4o. 1 free phone number provisioned. VAPI_API_KEY, VAPI_SALES_AGENT_ID, VAPI_PHONE_NUMBER_ID added to Cloudflare env vars. Issue ref: ISSUE 7 resolved.

## 2026-05-11 | ARCH | Native booking system — Calendly replaced
Decision: build native booking system instead of Calendly dependency. `/book` public page, `/book/[slug]` per-client, `/portal/availability` manager, iCal .ics on every booking. Google Calendar sync deferred to P1. Issue ref: ISSUE 9.

## 2026-05-11 | DOCS | Full documentation suite created
Files: `docs/SPEC.md`, `docs/SCHEMA.md`, `docs/OPS.md`, `ISSUE_LOG.md`, `CHANGE_LOG.md`
Pushed via `github:push_files` (local PAT).

## 2026-05-11 | ARCH | Retell AI → Vapi
Vapi selected: cleaner programmatic agent creation, better webhooks, stronger LLM integration. Issue ref: ISSUE 4.

## ~2026-05 | FEAT | Light theme + logo
`src/AIAutomatedCalls.jsx` — teal #1FA8A0, `assets/logos/logo-main.png`.

## ~2026-05 | FEAT | Marketing page integrated
`src/AIAutomatedCalls.jsx` — default route `/` → marketing page.

## ~2026-05 | INIT | Initial build
React 18 + Vite (14 pages), Supabase schema, n8n workflows, Retell prompt, GHL guide, Cloudflare Function. Deployed: Cloudflare Pages.

## ~2026-05 | INIT | Project inception
AI voice receptionists for local businesses. aiautomatedcalls.com secured.
Pricing: Starter $750/$1,200 | Standard $1,500/$2,000 | Premium $2,500/$3,000

---

## Upcoming

| Priority | Change | Issue |
|----------|--------|-------|
| P0 | DB migrations (7 tables) | ISSUE 6 |
| P0 | `submit-lead.js` | ISSUE 5 |
| P0 | `vapi-webhook.js` | ISSUE 8 |
| P0 | `check-availability.js` + `book-appointment.js` | ISSUE 9 |
| P0 | Native booking page `/book` | ISSUE 9 |
| P0 | Availability manager `/portal/availability` | ISSUE 9 |
| P0 | Wire marketing form | ISSUE 5 |
| P1 | Client onboarding wizard | — |
| P1 | Google Calendar OAuth | ISSUE 10 |
| P1 | Twilio SMS + Resend email post-call | — |
| P1 | Live data in all dashboards | ISSUE 2 |
| P1 | Post-call Claude analysis | — |
| P2 | Multi-agent routing | — |
| P2 | Stripe billing | — |
| P2 | AI insights dashboard | — |
