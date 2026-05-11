# CHANGE_LOG.md — AI Automated Calls

---

## 2026-05-11 | DOCS | Full documentation suite
Files: `docs/SPEC.md`, `docs/SCHEMA.md`, `docs/OPS.md`, `ISSUE_LOG.md`, `CHANGE_LOG.md`
Pushed via `github:push_files` (local PAT). Source of truth for all future prompts.

## 2026-05-11 | ARCH | Retell AI → Vapi
Cleaner programmatic agent creation, better webhooks, stronger LLM integration.
Retell files to be archived. Issue ref: ISSUE 4.

## ~2026-05 | FEAT | Light theme + logo
`src/AIAutomatedCalls.jsx` — teal #1FA8A0, `assets/logos/logo-main.png`.

## ~2026-05 | FEAT | Marketing page integrated
`src/AIAutomatedCalls.jsx` — default route `/` → marketing page.

## ~2026-05 | INIT | Initial build
React 18 + Vite (14 pages), Supabase schema, n8n, Retell prompt, GHL guide, Cloudflare Function.
Deployed: Cloudflare Pages (aiautomatedcalls.pages.dev)

## ~2026-05 | INIT | Project inception
AI voice receptionists for local businesses. aiautomatedcalls.com secured.
Pricing: Starter $750/$1,200 | Standard $1,500/$2,000 | Premium $2,500/$3,000

---

## Upcoming

| Priority | Change | Issue |
|----------|--------|-------|
| P0 | DB migrations | ISSUE 6 |
| P0 | Vapi account + agent | ISSUE 7 |
| P0 | `submit-lead.js` | ISSUE 5 |
| P0 | `vapi-webhook.js` | ISSUE 8 |
| P0 | n8n → Vapi update | ISSUE 4 |
| P1 | Client onboarding wizard | — |
| P1 | Twilio provisioning | — |
| P1 | Live dashboard data | ISSUE 2 |
| P1 | Post-call Claude analysis | — |
| P2 | Multi-agent routing | — |
| P2 | Stripe billing | — |
| P2 | AI insights dashboard | — |
