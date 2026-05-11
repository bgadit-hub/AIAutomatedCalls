# CHANGE_LOG.md — AI Automated Calls

---

## 2026-05-11 | FIX | vapi-webhook.js — remove call_attempts:999 bug
Removed hardcoded `call_attempts: 999` from `handleCallEnded` lead update.
n8n retry workflow handles the increment. Bug would have corrupted retry counter.

## 2026-05-11 | DB | Add UNIQUE constraints for upsert idempotency
Migration `add_unique_constraints_for_upsert`:
- `recordings.vapi_call_id` UNIQUE — enables merge-duplicates upsert in handleCallStarted
- `call_transcripts.recording_id` UNIQUE — enables merge-duplicates upsert in handleTranscript

## 2026-05-11 | FEAT | check-availability.js + book-appointment.js
Two new Cloudflare Functions for the public /book page:
- `GET /api/check-availability?client_id=X&date=YYYY-MM-DD` — returns available slots
- `POST /api/book-appointment` — books confirmed appointment, double-booking protected
Both verify all column names against actual DB schema (phone, not patient_phone, etc.)

## 2026-05-11 | FEAT | n8n Layer 1 trigger workflow (Vapi)
File: `n8n/LAYER1_TRIGGER_WORKFLOW.json`
Website lead → n8n webhook → 45s delay → Vapi outbound call → Supabase update + GHL contact.
Includes retry cron (10am/2pm/6pm, max 3 attempts). Issue ref: ISSUE 4 resolved.

## 2026-05-11 | DOCS | THOUGHT_PROCESS.md added to repo
Session management rule: small sessions, ask to continue, never ask user to push manually.

## 2026-05-11 | FEAT | vapi-webhook.js (Cloudflare Function)
Idempotent handler: call-started, end-of-call-report, transcript, tool-calls, transfer.
Tool handlers: check_availability, book_appointment, qualify_lead, book_demo, transfer_to_human.

## 2026-05-11 | FEAT | submit-lead.js (Cloudflare Function)
Form → dedupe check → Supabase INSERT → n8n trigger (fire-and-forget).

## 2026-05-11 | FEAT | AIAutomatedCalls.jsx — lead form wired
Hero section: name + phone + business type form → POST /api/submit-lead.
Success/loading/error states.

## 2026-05-11 | DB | All migrations applied — 18 tables live
11 migrations: clients, leads, recordings, appointments altered. agents, call_transcripts,
agent_templates, notifications, subscriptions, availability, booking_settings created.

## 2026-05-11 | DB | SCHEMA.md corrected to actual DB state
## 2026-05-11 | CONFIG | Vapi account + Sales Closer agent (Brian / eleven_flash_v2_5 / GPT-4o)
## 2026-05-11 | ARCH | Retell AI → Vapi migration complete

---

## Upcoming (in priority order)

| Priority | What | Issue |
|----------|------|-------|
| P0 | Import LAYER1_TRIGGER_WORKFLOW into n8n dashboard, activate, copy webhook URL | ISSUE 12 |
| P0 | Set env vars in Cloudflare: SUPABASE_SERVICE_ROLE_KEY, VAPI_WEBHOOK_SECRET, N8N_WEBHOOK_URL, N8N_WEBHOOK_SECRET | ISSUE 13 |
| P0 | Set VAPI_WEBHOOK_SECRET in Vapi dashboard → Webhooks | ISSUE 13 |
| P0 | /book public booking page (React route in AIAutomatedCalls.jsx) | ISSUE 9 |
| P1 | /portal/availability manager (admin page for clients to set hours) | ISSUE 9 |
| P1 | Live data in dashboards (replace mock data with Supabase queries) | ISSUE 2 |
| P1 | Post-call Claude analysis n8n workflow | — |
| P2 | Stripe billing | — |
| P2 | Client onboarding wizard | — |
