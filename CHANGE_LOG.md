# CHANGE_LOG.md — AI Automated Calls

---

## 2026-05-11 | FEAT | n8n Layer 1 trigger workflow (Vapi)
File: `n8n/LAYER1_TRIGGER_WORKFLOW.json`
Website lead → n8n webhook → 45s delay → Vapi outbound call → Supabase update + GHL contact.
Includes retry cron (10am/2pm/6pm, max 3 attempts). Issue ref: ISSUE 4 resolved (C9).

## 2026-05-11 | DOCS | THOUGHT_PROCESS.md added to repo
Step 10 added: session wrap-up rule. Files >50KB rule. Small session rule.

## 2026-05-11 | FEAT | vapi-webhook.js (Cloudflare Function)
Idempotent handler: call-started, end-of-call-report, transcript, tool-calls, transfer.
Tool handlers: check_availability, book_appointment, qualify_lead, book_demo, transfer_to_human.

## 2026-05-11 | FEAT | submit-lead.js (Cloudflare Function)
Form → dedupe check → Supabase INSERT → n8n trigger (fire-and-forget).

## 2026-05-11 | FEAT | AIAutomatedCalls.jsx — lead form wired
Hero section: name + phone + business type form → POST /api/submit-lead.
Success/loading/error states. Saved to outputs for manual push.

## 2026-05-11 | DB | All migrations applied — 18 tables live
11 migrations: clients, leads, recordings, appointments altered. agents, call_transcripts, agent_templates, notifications, subscriptions, availability, booking_settings created.

## 2026-05-11 | DOCS | SCHEMA.md corrected to actual DB state
Realised calls=recordings, business_name=name, plan=tier, etc.

## 2026-05-11 | DOCS | Full documentation suite + session review
SPEC, SCHEMA, OPS, ISSUE_LOG, CHANGE_LOG all updated.

## 2026-05-11 | CONFIG | Vapi account + Sales Closer agent
Brian / eleven_flash_v2_5 / GPT-4o. Env vars set in Cloudflare.

## 2026-05-11 | ARCH | Retell AI → Vapi

## ~2026-05 | FEAT | Light theme + logo

## ~2026-05 | FEAT | Marketing page integrated

## ~2026-05 | INIT | Initial build

---

## Upcoming

| Priority | What | Issue |
|----------|------|-------|
| P0 | Import LAYER1_TRIGGER_WORKFLOW into n8n, set creds, activate, copy webhook URL → Cloudflare | ISSUE 12 |
| P0 | Set VAPI_WEBHOOK_SECRET in Cloudflare + Vapi dashboard | ISSUE 13 |
| P0 | Manual push of AIAutomatedCalls.jsx | ISSUE 5 |
| P0 | `check-availability.js` + `book-appointment.js` | ISSUE 9 |
| P0 | `/book` public booking page | ISSUE 9 |
| P1 | `/portal/availability` manager | ISSUE 9 |
| P1 | Client onboarding wizard | — |
| P1 | Live data in dashboards | ISSUE 2 |
| P1 | Post-call Claude analysis | — |
| P2 | Multi-agent routing | — |
| P2 | Stripe billing | — |
