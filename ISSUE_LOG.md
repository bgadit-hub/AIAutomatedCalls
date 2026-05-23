# ISSUE_LOG.md — AI Automated Calls

> Never re-discover a logged problem.

---

## ISSUE 1 — GitHub MCP Write Access ✅ Resolved
`github:push_files` via local PAT works. `GitHub MCP:push_files` (Copilot) returns 403 — always use local tool. Files >50KB: save to outputs, manual push.

## ISSUE 2 — Template Data on Live Site ⚠️ Open (P1)
Mock data still in dashboard. Replace when live Supabase queries wired (P1).

## ISSUE 3 — White Screen After Marketing Page Push ✅ Resolved
User resolved. If recurs: check import errors, Cloudflare env vars, Vite build log.

## ISSUE 4 — Retell → Vapi Migration ✅ Resolved
New workflow `n8n/LAYER1_TRIGGER_WORKFLOW.json` built and pushed (Session 7).
Flow: website form → submit-lead.js → n8n webhook → 45s → Vapi outbound call.
Old `n8n/TRIGGER_WORKFLOW.json` (cold email / Instantly.ai) kept for reference.
Retell files (`retell/`) still need archiving.

## ISSUE 5 — Marketing Form Not Wired ✅ Resolved
submit-lead.js built and pushed. AIAutomatedCalls.jsx updated with live form (saved to outputs for manual push).
User must run: `cp ~/Downloads/AIAutomatedCalls.jsx src/AIAutomatedCalls.jsx && git push`

## ISSUE 6 — DB Schema Partially Applied ✅ Resolved
11 migrations applied (Session 6). 18 tables confirmed live.

## ISSUE 7 — No Vapi Account ✅ Resolved
Vapi account created. Sales Closer agent: Brian / eleven_flash_v2_5 / GPT-4o. Phone number provisioned.

## ISSUE 8 — No Vapi Webhook Handler ✅ Resolved
`functions/api/vapi-webhook.js` built and pushed (Session 6).

## ISSUE 9 — Native Booking System Not Built ⚠️ Open (P0)
DB tables live (availability, booking_settings). Still need:
- `functions/api/check-availability.js`
- `functions/api/book-appointment.js`
- `/book` public booking page
- `/portal/availability` manager

## ISSUE 10 — Google Calendar Sync Deferred ⚠️ Open (P1)
iCal .ics on every booking for now. Google Calendar OAuth deferred to P1.

## ISSUE 11 — SCHEMA.md Was Out Of Sync ✅ Resolved
Corrected in Session 6. Real column names documented.

## ISSUE 12 — n8n Workflow Not Configured in n8n Dashboard ⚠️ Open (P0)
Workflow JSON pushed to GitHub but not yet imported into n8n cloud.
User must: import LAYER1_TRIGGER_WORKFLOW.json → set credentials → activate → copy webhook URL → set N8N_WEBHOOK_URL in Cloudflare.

## ISSUE 13 — VAPI_WEBHOOK_SECRET Not Set ⚠️ Open (P0)
Need to: generate random string → set in Cloudflare as VAPI_WEBHOOK_SECRET → set same value in Vapi dashboard (Webhooks > Secret).

## ISSUE 14 — Image Duplication Across Niche Pages ✅ Resolved (Session 8)
3 Unsplash photo IDs appeared on 8–12 pages simultaneously, making every page look identical in the feature grid.

**Root cause:** Template builder reused the same 3 photo IDs for "scheduling", "after-hours", and "outbound" feature cards across all 12 niche page templates.

**Fix:** `run_transforms.py` replaced all 3 globally + applied 8 page-specific overrides.
See CHANGE_LOG Session 8 for full replacement table and commit SHAs.

---

## Correction Log

| # | Issue | Resolution | Session |
|---|-------|-----------|--------|
| C1 | ISSUE 2 | Light theme + logo | Session 3 |
| C2 | ISSUE 3 | White screen resolved | Session 4 |
| C3 | ISSUE 1 | `github:push_files` confirmed working | Session 5 |
| C4 | ISSUE 7 | Vapi account + agent + number | Session 6 |
| C5 | ISSUE 6 | All 11 migrations applied | Session 6 |
| C6 | ISSUE 11 | SCHEMA.md corrected | Session 6 |
| C7 | ISSUE 8 | vapi-webhook.js built | Session 6 |
| C8 | ISSUE 5 | submit-lead.js built, form wired | Session 6 |
| C9 | ISSUE 4 | LAYER1_TRIGGER_WORKFLOW.json built | Session 7 |
| C10 | ISSUE 14 | Image dedup + 3D effects — all 12 niche pages | Session 8 |
