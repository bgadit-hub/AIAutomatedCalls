# ISSUE_LOG.md — AI Automated Calls

> Never re-discover a logged problem.

---

## ISSUE 1 — GitHub MCP Write Access ✅ Resolved
Local PAT (`github:push_files`) works. GitHub Copilot MCP (`GitHub MCP:push_files`) returns 403 — use local tool only.

## ISSUE 2 — Template Data on Live Site ✅ Resolved (partial)
Mock data (Mitchell Dental etc.) still in dashboard. Replace when live Supabase queries wired (P1).

## ISSUE 3 — White Screen After Marketing Page Push ✅ Resolved
User resolved. If recurs: check import errors, Cloudflare env vars, Vite build log.

## ISSUE 4 — Retell → Vapi Migration ⚠️ Open
All new call code on Vapi. Archive `retell/` files. Update n8n workflow nodes.

## ISSUE 5 — Marketing Form Not Wired ⚠️ Open (P0)
Form is UI-only. Fix: form → `submit-lead.js` → Supabase INSERT → n8n → Vapi call.

## ISSUE 6 — DB Schema Partially Applied ⚠️ Open (P0)
New tables needed: `agents`, `call_transcripts`, `agent_templates`, `notifications`, `subscriptions`.
Verify exist: `profiles`, `clients`, `leads`, `calls`, `appointments`.

## ISSUE 7 — No Vapi Account ⚠️ Open (P0)
Create at vapi.ai → billing → Sales Closer agent → phone number → set Cloudflare env vars.

## ISSUE 8 — No Vapi Webhook Handler ⚠️ Open (P0)
Build `functions/api/vapi-webhook.js` — idempotent, all events per SPEC.md §8.

---

## Correction Log

| # | Issue | Resolution | Session |
|---|-------|-----------|--------|
| C1 | ISSUE 2 | Light theme + logo | Session 3 |
| C2 | ISSUE 3 | White screen resolved | Session 4 |
| C3 | ISSUE 1 | `github:push_files` via local PAT confirmed working | Session 5 |
