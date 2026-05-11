# ISSUE_LOG.md — AI Automated Calls

> Never re-discover a logged problem.

---

## ISSUE 1 — GitHub MCP Write Access ✅ Resolved
`github:push_files` via local PAT works. `GitHub MCP:push_files` (Copilot) returns 403 — always use local tool.

## ISSUE 2 — Template Data on Live Site ✅ Resolved (partial)
Mock data (Mitchell Dental etc.) still in dashboard. Will be replaced in P1 when live Supabase queries wired.

## ISSUE 3 — White Screen After Marketing Page Push ✅ Resolved
User resolved independently. If recurs: check import errors in AIAutomatedCalls.jsx, Cloudflare env vars, Vite build log.

## ISSUE 4 — Retell → Vapi Migration ⚠️ Open
All new code on Vapi. Archive `retell/` files. Update n8n workflow nodes from Retell to Vapi HTTP calls.

## ISSUE 5 — Marketing Form Not Wired ⚠️ Open (P0)
Form is UI-only. Fix: POST to `functions/api/submit-lead.js` → Supabase INSERT → n8n webhook → 45s delay → Vapi outbound call.

## ISSUE 6 — DB Schema Partially Applied ⚠️ Open (P0)
Original 5 tables applied (Session 2): profiles, clients, leads, calls, appointments.
Pending migrations: agents, call_transcripts, agent_templates, notifications, subscriptions, availability, booking_settings.

## ISSUE 7 — No Vapi Account ✅ Resolved
Vapi account created (Session 6). Sales Closer agent built: Brian voice (`nPczCjzI2devNBz1zQrb`) / `eleven_flash_v2_5` / GPT-4o. Phone number provisioned (free). VAPI_API_KEY, VAPI_SALES_AGENT_ID, VAPI_PHONE_NUMBER_ID all set in Cloudflare.

## ISSUE 8 — No Vapi Webhook Handler ⚠️ Open (P0)
Build `functions/api/vapi-webhook.js` — idempotent. Must handle: call.started, call.ended, transcript.ready, tool.called, transfer.initiated, voicemail.detected. Verify `x-vapi-secret` header on every request.

## ISSUE 9 — Native Booking System Not Built ⚠️ Open (P0)
Decided to build native booking instead of Calendly dependency (Session 6). Need:
- `/book` public page (marketing style)
- `/book/[slug]` per-client public page
- `/portal/availability` manager
- `functions/api/check-availability.js` (Vapi tool call)
- `functions/api/book-appointment.js` (Vapi tool call + .ics generation)
- DB tables: availability, booking_settings (schema written, not yet applied)

## ISSUE 10 — Google Calendar Sync Deferred ⚠️ Open (P1)
Google Calendar OAuth integration planned but deferred to P1. Currently: iCal .ics file attached to confirmation email on every booking. No live two-way sync until P1.

---

## Correction Log

| # | Issue | Resolution | Session |
|---|-------|-----------|--------|
| C1 | ISSUE 2 | Light theme + logo applied | Session 3 |
| C2 | ISSUE 3 | White screen resolved | Session 4 |
| C3 | ISSUE 1 | `github:push_files` confirmed working | Session 5 |
| C4 | ISSUE 7 | Vapi account + agent + number provisioned | Session 6 |
