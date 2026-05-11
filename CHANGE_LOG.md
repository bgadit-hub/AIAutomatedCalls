# CHANGE_LOG.md — AI Automated Calls

---

## 2026-05-11 | SESSION 2 ─────────────────────────────────────

## 2026-05-11 | FEAT | Pipeline stage sync to Supabase (AIAutomatedCalls.jsx)
`AdminPipeline.move()` is now async — optimistic local update fires first (instant UI),
then `supabase.from('leads').update({ stage }).eq('id')` persists to DB.
Stage changes now survive page refresh.

## 2026-05-11 | FEAT | Add Lead modal in pipeline (AIAutomatedCalls.jsx)
"Add Lead" button now opens a functional modal:
- Fields: business name, contact name, phone, email, city, niche, tier
- Inserts into `leads` table with `stage='cold'`, `source='manual'`
- Optimistically prepends the new lead to the Cold column immediately
- Shows ✓ success / ✗ error inline, auto-closes 2s after success

## 2026-05-11 | FEAT | n8n/REMINDER_WORKFLOW.json — 24h appointment reminders
Hourly cron workflow:
- Queries `appointments` where `status='confirmed'`, `reminder_sent=false`,
  `patient_email IS NOT NULL`, `scheduled_at` in next 24h
- Per appointment: fetches client business name + phone for branded email
- Sends HTML reminder email via Resend API
- Updates `reminder_sent=true` to prevent duplicates
- Required n8n env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `RESEND_API_KEY`, `RESEND_FROM`

---

## 2026-05-11 | SESSION 1 ─────────────────────────────────────

## 2026-05-11 | FEAT | Booking confirmation emails via Resend
`functions/api/book-appointment.js` updated:
- Fetches client business name + phone from Supabase after insert
- Sends professional HTML confirmation email via Resend API (fire-and-forget)
- Updates `appointments.confirmation_sent = true` on success
- Fails silently if `RESEND_API_KEY` not set — booking always succeeds

## 2026-05-11 | DOCS | SETUP.md — comprehensive deployment guide
8-step guide: Cloudflare env vars, Supabase admin user, n8n import, Vapi webhook,
Resend setup, client onboarding, end-to-end test flow + architecture diagram.

## 2026-05-11 | FEAT | n8n POSTCALL_WORKFLOW.json — full Vapi rewrite
- Layer 1 (AI sales): Claude analysis → call_transcripts upsert → leads stage → GHL routing
- Layer 2 (receptionist): Claude coaching → call_transcripts upsert → Slack on booking

## 2026-05-11 | FEAT | functions/api/admin/invite-client.js
`POST /api/admin/invite-client` — verifies admin JWT → Supabase Auth invite → creates clients row.

## 2026-05-11 | FEAT | Admin "Add Client" modal + live data hooks (useSupabase.js)
All 6 dashboard components now show live Supabase data.
Hooks: `useAdminStats`, `useClients`, `useLeads`, `useClientContext`, `useRecordings`, `useAppointments`.

## 2026-05-11 | FEAT | check-availability.js + book-appointment.js + BookingPage.jsx
Patient-facing booking flow with availability, double-booking protection.

## 2026-05-11 | FEAT | n8n LAYER1_TRIGGER_WORKFLOW.json + vapi-webhook.js + submit-lead.js
Full lead-to-call automation. Retry cron 3×.

## 2026-05-11 | DB | 17 migrations — 17 tables live
clients, leads, recordings, appointments, call_transcripts, availability, booking_settings, +10 more.

---

## Remaining Tasks (in priority order)

| Priority | What | Notes |
|----------|------|-------|
| **P0 — You do** | Add env vars to Cloudflare Pages | See SETUP.md Step 1 |
| **P0 — You do** | Import n8n workflows, activate | See SETUP.md Step 3 |
| **P0 — You do** | Set Vapi webhook URL + secret | See SETUP.md Step 4 |
| **P0 — You do** | Create admin user in Supabase | See SETUP.md Step 2 |
| **P0 — You do** | Add `RESEND_API_KEY`/`RESEND_FROM` to n8n env vars | For reminder emails |
| P2 | Stripe billing integration | Customer, subscription, webhook handler |
| P3 | Admin analytics with real call data | Replace mock charts in AdminAnalytics |
