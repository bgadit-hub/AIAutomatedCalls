# CHANGE_LOG.md — AI Automated Calls

---

## 2026-05-11 | FEAT | Booking confirmation emails via Resend
`functions/api/book-appointment.js` updated:
- Fetches client business name + phone from Supabase after insert
- Sends professional HTML confirmation email via Resend API (fire-and-forget)
- Updates `appointments.confirmation_sent = true` on success
- Fails silently if `RESEND_API_KEY` not set — booking always succeeds
- Returns `email_sent: true/false` in response

## 2026-05-11 | DOCS | SETUP.md — comprehensive deployment guide
Created `SETUP.md` covering all 8 steps to go live:
Cloudflare env vars, Supabase admin user creation, n8n workflow import,
Vapi webhook config, Resend setup, client onboarding, end-to-end test flow.
Architecture diagram included.

## 2026-05-11 | FEAT | n8n POSTCALL_WORKFLOW.json — full Vapi rewrite
Complete replacement of Retell-based workflow with Vapi-native processor:
- Webhook path `post-call` (auto-derived by vapi-webhook.js from N8N_WEBHOOK_URL)
- Layer routing: layer1 (AI sales calls) vs layer2 (client receptionist calls)
- Layer 1: Claude analyzes transcript → outcome/score/sentiment/objections/improvement_tips
  → upserts `call_transcripts` → updates `leads` stage in Supabase → GHL tag routing
- Layer 2: Claude analyzes transcript → summary/key_moments/missed_opportunities/ai_coaching_notes
  → upserts `call_transcripts` → Slack notification if appointment booked
- All Supabase calls use `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` n8n env vars
- Setup notes embedded in `_SETUP_NOTES` key for easy reference

## 2026-05-11 | FEAT | functions/api/admin/invite-client.js
New Cloudflare Function: `POST /api/admin/invite-client`
- Verifies caller JWT → checks `profiles.role = 'admin'` in Supabase
- Invites user via Supabase Auth `/auth/v1/invite` → sends magic link email
- Creates `clients` row with `profile_id = new_user.id`
- `handle_new_user` trigger auto-creates `profiles` row with `role: 'client'`

## 2026-05-11 | FEAT | Admin "Add Client" modal (AIAutomatedCalls.jsx)
`AdminClients` now has a fully functional modal:
- Fields: business name, contact name, email, city, phone, tier, MRR
- POSTs to `/api/admin/invite-client` with admin JWT header
- Shows success/error inline, auto-closes 3s after success
- Empty state updated: "No clients yet. Click 'Add Client' to onboard your first one."

## 2026-05-11 | FEAT | src/useSupabase.js — live data hooks
New file with all data hooks for dashboard components:
- Admin: `useAdminStats()`, `useClients()`, `useLeads()`
- Client: `useClientContext()`, `useRecordings(clientId)`, `useAppointments(clientId)`
- Helpers: `fmtDuration`, `fmtDateTime`, `fmtDate`, `fmtRelative`
- All hooks return `null` while loading → components show mock data (no flash)

## 2026-05-11 | FEAT | Dashboard live data (AIAutomatedCalls.jsx)
All 6 dashboard components now show live Supabase data:
- `AdminOverview`: real client count, MRR, pipeline count, calls today
- `AdminClients`: real clients table, search works on live data
- `AdminPipeline`: real leads from DB, drag-to-stage still works
- `ClientDashboard`: real business name, plan, call count from DB
- `ClientRecordings`: real calls with transcript + audio link
- `ClientAppointments`: real upcoming/recent appointments with counts

---

## 2026-05-11 | FIX | vapi-webhook.js — remove call_attempts:999 bug
Removed hardcoded `call_attempts: 999` from `handleCallEnded` lead update.
n8n retry workflow handles the increment.

## 2026-05-11 | DB | Add UNIQUE constraints for upsert idempotency
Migration `add_unique_constraints_for_upsert`:
- `recordings.vapi_call_id` UNIQUE
- `call_transcripts.recording_id` UNIQUE

## 2026-05-11 | FEAT | check-availability.js + book-appointment.js
- `GET /api/check-availability?client_id=X&date=YYYY-MM-DD` — returns available slots
- `POST /api/book-appointment` — books appointment, double-booking protected

## 2026-05-11 | FEAT | n8n LAYER1_TRIGGER_WORKFLOW.json (Vapi)
Lead → n8n webhook → 45s delay → Vapi outbound call → Supabase + GHL.
Retry cron at 10am/2pm/6pm, max 3 attempts.

## 2026-05-11 | FEAT | vapi-webhook.js — Vapi event handler
Idempotent: call-started, end-of-call-report, transcript, tool-calls, transfer.

## 2026-05-11 | FEAT | submit-lead.js
Form → dedupe → Supabase INSERT → n8n trigger.

## 2026-05-11 | DB | 17 migrations applied — 17 tables live
clients, leads, recordings, appointments, agents, call_transcripts,
agent_templates, notifications, subscriptions, availability, booking_settings.

---

## Remaining Tasks (in priority order)

| Priority | What | Notes |
|----------|------|-------|
| **P0 — You do** | Add env vars to Cloudflare Pages | See SETUP.md Step 1 |
| **P0 — You do** | Import n8n workflows, set credentials, activate | See SETUP.md Step 3 |
| **P0 — You do** | Set Vapi webhook URL + secret | See SETUP.md Step 4 |
| **P0 — You do** | Create admin user in Supabase | See SETUP.md Step 2 |
| P2 | Stripe billing integration | Create customer, subscription, webhook handler |
| P2 | Lead pipeline stage sync to Supabase | Currently drag-drop is local only |
| P3 | Appointment reminder emails (24h before) | Cron n8n workflow |
| P3 | Admin analytics with real call data | Replace mock charts |
| P3 | GHL contact auto-create on lead form submit | Already in n8n workflow |
