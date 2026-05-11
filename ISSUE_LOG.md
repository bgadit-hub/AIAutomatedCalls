# ISSUE_LOG.md — AI Automated Calls

> Never re-discover a logged problem.

---

## ISSUE 1 — GitHub MCP Write Access ✅ Resolved
`github:push_files` via local PAT works. `GitHub MCP:push_files` (Copilot) returns 403 — always use local tool.

## ISSUE 2 — Template Data on Live Site ⚠️ Open (P1)
Mock data still in dashboard. Replace when live Supabase queries wired (P1).

## ISSUE 3 — White Screen After Marketing Page Push ✅ Resolved
User resolved. If recurs: check import errors, Cloudflare env vars, Vite build log.

## ISSUE 4 — Retell → Vapi Migration ⚠️ Open
All new code on Vapi. Archive `retell/` files. Update n8n workflow nodes. DB columns retained for backward compat (retell_agent_id, retell_call_id, retell_called).

## ISSUE 5 — Marketing Form Not Wired ⚠️ Open (P0)
Form is UI-only. Fix: POST to `functions/api/submit-lead.js` → Supabase INSERT → n8n webhook → 45s delay → Vapi outbound call.

## ISSUE 6 — DB Schema Partially Applied ✅ Resolved
11 migrations applied (Session 6). All 18 tables now exist and verified.
Migrations applied:
- add_vapi_columns_to_clients
- add_vapi_columns_to_leads
- add_vapi_columns_to_recordings
- add_booking_columns_to_appointments
- create_agents_table
- create_call_transcripts_table
- create_agent_templates_table
- create_notifications_table
- create_subscriptions_table
- create_availability_table
- create_booking_settings_table

## ISSUE 7 — No Vapi Account ✅ Resolved
Vapi account created. Sales Closer agent: Brian (`nPczCjzI2devNBz1zQrb`) / `eleven_flash_v2_5` / GPT-4o. Phone number provisioned. All env vars set in Cloudflare.

## ISSUE 8 — No Vapi Webhook Handler ⚠️ Open (P0)
Build `functions/api/vapi-webhook.js` — idempotent, verify x-vapi-secret header, handle all events in SPEC.md §8.

## ISSUE 9 — Native Booking System Not Built ⚠️ Open (P0)
DB tables now exist (availability, booking_settings). Still need:
- `functions/api/check-availability.js`
- `functions/api/book-appointment.js` (+ .ics generation)
- `/book` public page
- `/portal/availability` manager

## ISSUE 10 — Google Calendar Sync Deferred ⚠️ Open (P1)
iCal .ics on every booking for now. Google Calendar OAuth deferred to P1.

## ISSUE 11 — SCHEMA.md Was Out Of Sync With Real DB ✅ Resolved
SCHEMA.md was written as ideal spec, not actual DB state. Corrected in Session 6:
- `calls` table is actually `recordings`
- `clients.business_name` is actually `clients.name`
- `clients.plan` is actually `clients.tier`
- `appointments.call_id` is actually `appointments.recording_id`
- `appointments.patient_phone` is actually `appointments.phone`
- `leads.status` is actually `leads.stage`
All future queries must use actual column names from SCHEMA.md.

---

## Correction Log

| # | Issue | Resolution | Session |
|---|-------|-----------|--------|
| C1 | ISSUE 2 | Light theme + logo | Session 3 |
| C2 | ISSUE 3 | White screen resolved | Session 4 |
| C3 | ISSUE 1 | `github:push_files` confirmed working | Session 5 |
| C4 | ISSUE 7 | Vapi account + agent + number provisioned | Session 6 |
| C5 | ISSUE 6 | All 11 migrations applied, 18 tables verified | Session 6 |
| C6 | ISSUE 11 | SCHEMA.md corrected to reflect actual DB | Session 6 |
