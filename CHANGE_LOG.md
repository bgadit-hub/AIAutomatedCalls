# CHANGE_LOG.md — AI Automated Calls

---

## 2026-05-11 | DB | All migrations applied — 18 tables live
11 migrations applied to Supabase (`tkqxwgmkqfusyzrdgacz`):
- ALTER clients: +industry, +contact_email, +website, +address, +business_hours, +setup_fee_paid, +monthly_fee, +vapi_agent_id, +vapi_number_id, +phone_number, +gcal_refresh_token
- ALTER leads: +pain_point, +source, +call_status, +call_attempts, +last_called_at, +demo_booked_at, +demo_date, +qualified_score, +ghl_contact_id, +vapi_called
- ALTER recordings: +vapi_call_id, +layer, +lead_id, +sentiment, +sentiment_score, +transfer_number, +voicemail_left, +cost_cents, +started_at, +ended_at, +call_status + 3 indexes
- ALTER appointments: +lead_id, +patient_email, +duration_minutes, +calendar_source, +calendar_event_id, +ical_uid, +confirmation_sent, +reminder_sent
- CREATE agents (with RLS + GRANTs)
- CREATE call_transcripts (with RLS + GRANTs)
- CREATE agent_templates (with RLS + GRANTs)
- CREATE notifications (with RLS + GRANTs)
- CREATE subscriptions (with RLS + GRANTs)
- CREATE availability (with RLS + GRANTs)
- CREATE booking_settings (with RLS + GRANTs)
Issue ref: ISSUE 6 resolved (C5)

## 2026-05-11 | DOCS | SCHEMA.md corrected to reflect actual DB
Real schema differed from spec. Key corrections: calls→recordings, business_name→name, plan→tier, call_id→recording_id, patient_phone→phone, status→stage.
Issue ref: ISSUE 11 resolved (C6)

## 2026-05-11 | DOCS | Session 6 — full doc review and update
Thought_Process.md invoked. All 5 docs read from GitHub. Full gap analysis. All docs updated.

## 2026-05-11 | CONFIG | Vapi account + Sales Closer agent
Brian voice / eleven_flash_v2_5 / GPT-4o. VAPI_API_KEY, VAPI_SALES_AGENT_ID, VAPI_PHONE_NUMBER_ID in Cloudflare.

## 2026-05-11 | ARCH | Native booking system — Calendly replaced
/book page, /portal/availability, iCal .ics. Google Calendar OAuth deferred P1.

## 2026-05-11 | DOCS | Full documentation suite created
SPEC, SCHEMA, OPS, ISSUE_LOG, CHANGE_LOG pushed to GitHub.

## 2026-05-11 | ARCH | Retell AI → Vapi

## ~2026-05 | FEAT | Light theme + logo

## ~2026-05 | FEAT | Marketing page integrated

## ~2026-05 | INIT | Initial build
React 18 + Vite, Supabase, n8n, Cloudflare Pages. Deployed: aiautomatedcalls.pages.dev

## ~2026-05 | INIT | Project inception
aiautomatedcalls.com secured. Pricing: Starter $750/$1,200 | Standard $1,500/$2,000 | Premium $2,500/$3,000

---

## Upcoming

| Priority | Change | Issue |
|----------|--------|-------|
| P0 | `submit-lead.js` | ISSUE 5 |
| P0 | `vapi-webhook.js` | ISSUE 8 |
| P0 | `check-availability.js` + `book-appointment.js` | ISSUE 9 |
| P0 | Native booking page `/book` | ISSUE 9 |
| P0 | Availability manager `/portal/availability` | ISSUE 9 |
| P0 | Wire marketing form | ISSUE 5 |
| P1 | Client onboarding wizard | — |
| P1 | Google Calendar OAuth | ISSUE 10 |
| P1 | Twilio SMS + Resend email | — |
| P1 | Live data in all dashboards | ISSUE 2 |
| P1 | Post-call Claude analysis | — |
| P1 | Archive Retell files | ISSUE 4 |
| P2 | Multi-agent routing | — |
| P2 | Stripe billing | — |
| P2 | AI insights dashboard | — |
