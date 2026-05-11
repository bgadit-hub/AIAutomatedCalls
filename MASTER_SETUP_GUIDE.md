# AI Automation Agency — Master Setup Guide
**Target:** $300–500/day net profit | Fully automated acquisition + delivery

---

## ACCOUNTS TO CREATE (Day 1 — ~2 hours)

### Priority order — do these first

| # | Service | URL | Plan | Cost | Purpose |
|---|---------|-----|------|------|---------|
| 1 | GoHighLevel | gohighlevel.com | Agency Starter ($97/mo) → upgrade to $297 at client 3 | $97/mo | CRM, automations, white-label, SMS, email, calendar |
| 2 | Retell AI | retellai.com | Pay-as-you-go | $0.07/min | AI voice agent — sales calls + client delivery |
| 3 | Twilio | twilio.com | Pay-as-you-go | ~$30/mo | Phone numbers, SMS delivery |
| 4 | n8n Cloud | n8n.io | Starter | $20/mo | Workflow automation hub |
| 5 | Instantly.ai | instantly.ai | Growth ($37/mo) | $37/mo | Cold email sending + tracking |
| 6 | Apollo.io | apollo.io | Free tier | $0 | Lead database |
| 7 | Anthropic API | console.anthropic.com | Pay-as-you-go | ~$50/mo | Claude for email personalization |
| 8 | Stripe | stripe.com | Free | 2.9%+30¢ | Payment processing |
| 9 | Loom | loom.com | Starter ($15/mo) | $15/mo | Demo video + analytics API |
| 10 | Carrd | carrd.co | Pro Standard ($19/yr) | $19/yr | Agency landing page |
| 11 | PandaDoc | pandadoc.com | Essentials ($19/mo) | $19/mo | Contract automation |

**Total month 1 cost: ~$334 + usage**

---

## PHONE NUMBERS TO BUY IN TWILIO (Day 1)

Buy these immediately — aged numbers perform better for deliverability:

1. **Sales outbound number** — used by Retell AI to call prospects
2. **Demo line** — permanent number prospects can call to test the AI (goes on website + in emails)
3. **Client delivery #1 buffer** — have ready for first client onboard

Buy local area code numbers matching your target city. Cost: $1/month each.

---

## DAY-BY-DAY EXECUTION

### Day 1 (4–5 hrs): Accounts + infrastructure
- [ ] Create all accounts above
- [ ] Buy 3 Twilio numbers
- [ ] Register domain for agency (e.g., `[yourname]ai.com` or `[city]aiagency.com`)
- [ ] Connect domain to Carrd
- [ ] Connect Twilio to Retell AI (Settings → Telephony → Add number)
- [ ] Connect Twilio to GHL (Settings → Phone Numbers → Import)

### Day 2 (5–6 hrs): Build the AI voice agent
- [ ] Create Retell AI agent using system prompt in `/retell/RETELL_SYSTEM_PROMPT.md`
- [ ] Upload knowledge base from `/retell/RETELL_KNOWLEDGE_BASE.md`
- [ ] Set LLM to Claude Sonnet 4 (claude-sonnet-4-20250514)
- [ ] Choose voice: "Evelyn" (warm, professional) or clone via ElevenLabs
- [ ] Configure escalation trigger (see system prompt file)
- [ ] Run 20 test calls — call your own demo number and try to stump it
- [ ] Record the demo Loom video (call the demo line, screen record your phone)

### Day 3 (4–5 hrs): n8n workflows
- [ ] Import trigger workflow from `/n8n/TRIGGER_WORKFLOW.json`
- [ ] Import post-call workflow from `/n8n/POSTCALL_WORKFLOW.json`
- [ ] Add credentials: Anthropic API, GHL API, Apollo API, Loom API, Retell AI API
- [ ] Test end-to-end: click a fake email link → confirm Retell call fires

### Day 4 (3–4 hrs): Outreach + landing page
- [ ] Deploy landing page from `/site/LANDING_PAGE.html` to Carrd
- [ ] Replace all [PLACEHOLDERS] with your actual info
- [ ] Embed Loom demo video + GHL calendar booking widget
- [ ] Load cold email sequence from `/outreach/EMAIL_SEQUENCE.md` into Instantly.ai
- [ ] Pull first 200 leads from Apollo (see `/outreach/APOLLO_SEARCH_GUIDE.md`)
- [ ] Upload leads to Instantly.ai campaign

### Day 5–7 (2 hrs/day): Launch + first clients
- [ ] Launch Instantly.ai campaign (40–50 emails/day to warm up)
- [ ] Connect Gmail to Instantly.ai (use a warmed domain — see note below)
- [ ] Monitor n8n for first triggered calls
- [ ] Check GHL for booked follow-ups
- [ ] Goal: 1–2 clients closed by end of day 7

---

## EMAIL DOMAIN WARMING (CRITICAL — do this day 1)

Cold email deliverability lives and dies by domain reputation.

1. Buy a **separate domain** for cold email (e.g., `[yourname]-agency.com`) — never use your main domain
2. Set up Google Workspace on it ($6/mo)
3. Connect to Instantly.ai's warmup feature immediately
4. Run warmup for **14 days minimum** before sending real campaigns
5. Set up SPF, DKIM, DMARC records (Instantly.ai has a guide)

**While warming up:** Use LinkedIn outreach and direct calls from day 5 to get first clients without email.

---

## GHL SUB-ACCOUNT TEMPLATE SETUP (Do after Day 2)

Each new client gets a GHL sub-account cloned from your master template.

### Master template contains:
- Welcome + onboarding SMS/email sequence (fires when Stripe payment clears)
- Appointment reminder sequence (24hr + 1hr before)
- No-show re-booking sequence (fires 30 min after missed appointment)
- Lead nurture sequence (7-day follow-up for unclosed leads)
- Monthly ROI report automation (fires on the 1st of each month)
- Referral ask automation (fires at day 30 of client relationship)

See `/ghl/GHL_AUTOMATION_GUIDE.md` for step-by-step configuration.

---

## PRICING SHEET

### What you charge clients

| Tier | Setup Fee | Monthly Retainer | What's included |
|------|-----------|-----------------|-----------------|
| Starter | $750 | $1,200/mo | AI voice (inbound only), basic CRM, appointment booking |
| Standard | $1,500 | $2,000/mo | Voice (in+outbound), SMS/email follow-up, monthly report |
| Premium | $2,500 | $3,000/mo | Everything + outbound lead reactivation + Google Ads mgmt |

**Lead with Standard.** It hits the right ROI/price balance for most SMBs.

### Your unit economics at scale

| Clients | Retainer revenue | Setup fees (1.5 new/mo) | Gross | Tool costs | Net/mo | Net/day |
|---------|-----------------|------------------------|-------|-----------|--------|---------|
| 3 | $6,000 | $2,250 | $8,250 | $520 | $7,730 | $258 |
| 5 | $10,000 | $2,250 | $12,250 | $580 | $11,670 | $389 ✓ |
| 8 | $16,000 | $2,250 | $18,250 | $660 | $17,590 | $586 ✓✓ |
| 10 | $20,000 | $2,250 | $22,250 | $720 | $21,530 | $718 |

---

## MONTHLY MAINTENANCE CHECKLIST (1–2 hrs total)

### Week 1 of each month (60 min)
- [ ] Read 5 call transcripts from Retell AI — note top objections the AI fumbled
- [ ] Update knowledge base with improved objection responses
- [ ] Review n8n error log — fix any broken automations
- [ ] Check Instantly.ai reply rate — adjust email subject lines if <3%

### Week 2 of each month (30 min)
- [ ] Review GHL monthly reports (auto-generated) — flag wins per client
- [ ] Check Retell AI call quality scores — any client agent degrading?
- [ ] Respond to any GHL-flagged client issues

### As needed
- [ ] New client onboard: clone GHL sub-account, configure Retell agent, test (3–4 hrs)
- [ ] Quarterly: review pricing, check competitor rates, consider upsell campaign

---

## ESCALATION CONTACTS

Keep these handy:

- Retell AI support: support@retellai.com | Discord community (fast responses)
- n8n community: community.n8n.io
- GHL support: 24/7 chat in dashboard
- Twilio support: console.twilio.com/help

---

## FILE INDEX

```
ai-agency-build/
├── MASTER_SETUP_GUIDE.md          ← you are here
├── retell/
│   ├── RETELL_SYSTEM_PROMPT.md    ← paste into Retell AI agent config
│   └── RETELL_KNOWLEDGE_BASE.md   ← upload as knowledge base doc
├── n8n/
│   ├── TRIGGER_WORKFLOW.json      ← import into n8n
│   └── POSTCALL_WORKFLOW.json     ← import into n8n
├── outreach/
│   ├── EMAIL_SEQUENCE.md          ← load into Instantly.ai
│   └── APOLLO_SEARCH_GUIDE.md     ← lead sourcing instructions
├── ghl/
│   └── GHL_AUTOMATION_GUIDE.md   ← GHL configuration walkthrough
└── site/
    └── LANDING_PAGE.html          ← deploy to Carrd or GHL funnel
```
