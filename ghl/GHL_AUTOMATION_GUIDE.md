# GoHighLevel (GHL) Automation Guide
# Complete setup for agency operations + client delivery

---

## ACCOUNT STRUCTURE

```
GHL Agency Account (your master account)
├── Agency Dashboard (your ops: leads, pipeline, billing)
├── Sub-Account: MASTER TEMPLATE (never use with real clients — clone only)
├── Sub-Account: Client 1 — [Business Name]
├── Sub-Account: Client 2 — [Business Name]
└── Sub-Account: Client N — [Business Name]
```

**Plan:** Start with Agency Starter ($97/mo → includes 1 sub-account)
Upgrade to Agency Unlimited ($297/mo) before client #3 — unlimited sub-accounts.

---

## PART 1: YOUR AGENCY PIPELINE (Master Account)

### Pipeline setup
Navigate to: **CRM → Pipelines → Add Pipeline**

**Pipeline name:** Agency Sales Pipeline

**Stages:**
```
1. Cold Lead          (new contacts from Apollo/Instantly)
2. Demo Watched       (clicked Loom link)
3. AI Called          (Retell AI dispatched)
4. Hot — Follow Up    (interested, needs follow-up)
5. Proposal Sent      (Stripe link sent)
6. Won — Onboarding  (payment received)
7. Active Client      (live, paying)
8. Churned            (cancelled — for tracking)
```

### Automation: New lead enters pipeline
Trigger: Contact created with tag "cold-email-lead"
Actions:
1. Add to pipeline → Stage: "Cold Lead"
2. Assign to pipeline owner
3. Send internal notification: "New lead: {{contact.name}} from {{contact.company_name}}"

### Automation: Demo watched
Trigger: Tag added "demo-watched"
Actions:
1. Move to stage "Demo Watched"
2. Update lead score +10
3. Log note: "Demo watched {{custom_field.demo_watch_pct}}%"

### Automation: Won — trigger onboarding
Trigger: Opportunity moved to stage "Won — Onboarding"
Actions:
1. Send welcome email (see template below)
2. Send onboarding form (Typeform/GHL form)
3. Wait 5 minutes
4. Send contract via PandaDoc (webhook trigger)
5. Add tag "awaiting-onboard"
6. Assign to you for setup

---

## PART 2: MASTER TEMPLATE SUB-ACCOUNT

Create this once. Clone it for every new client.

Navigate to: **Agency → Sub-Accounts → Add Sub-Account**
Name it: "MASTER TEMPLATE — DO NOT USE"

### 2A. Calendars
**Create these calendars:**

1. **New Client Consultation** (for sales — embed on your agency site)
   - Duration: 30 minutes
   - Buffer after: 15 minutes
   - Availability: Mon–Fri 9am–5pm your timezone
   - Confirmation message: "Looking forward to speaking with you. Here's a 3-min demo to watch before our call: [LOOM_LINK]"

2. **Client Appointment Calendar** (for each client's customers — cloned per client)
   - Duration: varies by business type (see niche settings)
   - Buffer: 10 minutes
   - Availability: pull from client's actual hours
   - Confirmation SMS: "Hi {{contact.first_name}}, your appointment at {{location.name}} is confirmed for {{appointment.time}}. Reply STOP to opt out."
   - Reminder SMS (24 hrs before): "Reminder: Your appointment tomorrow at {{appointment.time}}. See you then! Reply C to confirm or R to reschedule."
   - Reminder SMS (1 hr before): "Your appointment is in 1 hour at {{appointment.time}}. We're looking forward to seeing you!"

### 2B. Templates — SMS

**Template: Missed Call Text-Back**
```
Hey {{contact.first_name}}, sorry we missed your call! This is {{location.name}}.
How can we help? Reply here and we'll get back to you right away.
— {{location.name}} Team
```

**Template: New Lead Instant Follow-Up**
```
Hi {{contact.first_name}}, thanks for reaching out to {{location.name}}!
We'll be in touch shortly. In the meantime, is there anything specific
you'd like to know? Just reply to this message.
```

**Template: Appointment Confirmed**
```
✅ Confirmed! Your appointment at {{location.name}} is set for
{{appointment.start_time}} on {{appointment.date}}.
📍 {{location.address}}
Reply HELP for info or STOP to opt out.
```

**Template: No-Show Re-book**
```
Hi {{contact.first_name}}, we noticed you missed your appointment today.
No worries — these things happen! Ready to reschedule?
Book a new time here: {{calendar.booking_link}}
— {{location.name}}
```

**Template: Referral Ask (Day 30)**
```
Hi {{contact.first_name}}! It's been a month since we set up your AI receptionist.
Hope it's been helpful! Quick ask — if you know another [business type] owner
who struggles with missed calls, we'd love to help them too.

We'll give you 1 month FREE for every referral who signs up 🙌

Know anyone? Just reply with their name and we'll take it from there.
```

### 2C. Templates — Email

**Email: Onboarding Welcome**
```
Subject: Welcome to [AGENCY_NAME] — let's get your AI live in 48 hours

Hi {{contact.first_name}},

Excited to have you on board! Here's what happens next:

1. Complete your onboarding form (5 minutes): [FORM_LINK]
   — your business hours, services, calendar access, and top FAQs
   
2. We build your AI agent (24 hours after form received)

3. We run a test call with you (scheduled in the form)

4. Go live — your AI starts answering calls

Any questions? Just reply to this email — I check it daily.

Looking forward to showing you what this does for your practice.

[YOUR_NAME]
[AGENCY_NAME]
[YOUR_PHONE]
```

**Email: Monthly ROI Report**
```
Subject: Your AI Receptionist Report — {{date.month}} {{date.year}}

Hi {{contact.first_name}},

Here's your {{location.name}} AI Receptionist summary for {{date.month}}:

📞 Total calls handled: {{custom_field.monthly_calls}}
📅 Appointments booked: {{custom_field.monthly_bookings}}  
💬 After-hours calls answered: {{custom_field.after_hours_calls}}
⚡ Average response time: Under 2 rings, 24/7

Estimated value: {{custom_field.monthly_calls}} calls × {{custom_field.avg_booking_value}} 
= {{custom_field.monthly_revenue_protected}} in calls that didn't go to voicemail.

Call recordings and full transcripts: [DASHBOARD_LINK]

Anything you'd like to adjust — new services, updated hours, new FAQs? 
Just reply and we'll update it same day.

[YOUR_NAME]
```

**Email: 90-Day Upsell (Outbound + Ads)**
```
Subject: One more thing we could do for {{location.name}}

Hi {{contact.first_name}},

Quick thought — you've been using the AI receptionist for 3 months now
and it's been handling your inbound calls well.

One thing we haven't touched yet: the leads who visited your website
or called once and never followed up.

We can set up an AI that proactively reaches out to those cold leads —
calls them, qualifies them, and books appointments. Same AI, new direction.

A few clients doing this are seeing 20–30% of their old leads re-engage.

Worth a 15-minute call to look at whether it makes sense for you?
[BOOKING_LINK]

[YOUR_NAME]
```

### 2D. Workflows (Automations)

**Create these workflows in GHL → Automation → Workflows:**

---

**WORKFLOW 1: New Lead Welcome**
```
Trigger: Contact created (tag = "new-lead" OR source = "web form")

Step 1: Wait 1 minute
Step 2: Send SMS — "New Lead Instant Follow-Up" template
Step 3: Wait 5 minutes  
Step 4: If no reply → Send email (personalized intro)
Step 5: Add to pipeline → Stage "Cold Lead"
Step 6: Create task: "Follow up with {{contact.name}} — {{contact.company_name}}"
```

---

**WORKFLOW 2: Appointment Reminder Sequence**
```
Trigger: Appointment created in calendar

Step 1: Send SMS confirmation immediately (Appointment Confirmed template)
Step 2: Wait until 24 hours before appointment
Step 3: Send SMS — 24hr reminder
Step 4: Wait until 1 hour before appointment
Step 5: Send SMS — 1hr reminder
Step 6: After appointment time + 30 min: Check if appointment completed
  → If completed: Send "How was your experience?" SMS
  → If not completed (no-show): Send No-Show Re-book template
  → If rescheduled: Update and restart sequence
```

---

**WORKFLOW 3: No-Show Recovery**
```
Trigger: Appointment status = "No Show"

Step 1: Wait 30 minutes
Step 2: Send No-Show Re-book SMS
Step 3: Wait 24 hours (no reply)
Step 4: Send re-book email with booking link
Step 5: Wait 3 days (still no reply)
Step 6: AI outbound call attempt via Retell API (webhook)
Step 7: If still no engagement after 7 days: tag "cold-no-show", remove from active sequences
```

---

**WORKFLOW 4: Lead Nurture (7-Day)**
```
Trigger: Contact tagged "new-lead" AND not booked appointment

Day 0: New lead follow-up SMS (already sent in Workflow 1)
Day 1: Send value email ("What our AI handles that most practices miss")
Day 3: Send social proof SMS ("A dental office like yours just...")
Day 5: Send FAQ email ("Top 3 questions about AI receptionists")
Day 7: Send booking-push SMS ("Still a good time to connect?")
Day 14: Move to "long-term nurture" tag, monthly touch only
```

---

**WORKFLOW 5: Client Day-30 Referral Ask**
```
Trigger: Contact tagged "active-client" + created date = 30 days ago

Step 1: Send Referral Ask SMS template
Step 2: Wait 3 days (no reply)
Step 3: Send referral email (same offer, more detail)
Step 4: If referral received: tag "referral-source", add $200 credit note to their account
```

---

**WORKFLOW 6: Monthly Report Trigger**
```
Trigger: 1st of each month at 8am

Step 1: n8n webhook → pull Retell AI call stats for this client
Step 2: n8n → calculate monthly metrics
Step 3: n8n → update GHL custom fields with metrics
Step 4: GHL sends Monthly ROI Report email template
```
Note: Steps 1–3 require the n8n monthly report workflow (build separately).

---

**WORKFLOW 7: Churn Prevention**
```
Trigger: Contact tagged "active-client" + last activity > 21 days

Step 1: Send check-in SMS: "Hey {{contact.first_name}}, just checking in —
  how's everything going with the AI receptionist? 
  Anything you'd like us to update or tweak?"

Step 2: Wait 3 days (no reply)
Step 3: Create internal task: "⚠️ Churn risk — {{contact.name}} hasn't engaged in 3 weeks"
Step 4: Tag "churn-risk"
```

---

## PART 3: ONBOARDING FORM (GHL Form Builder)

Create this form in your MASTER TEMPLATE under Forms/Surveys.

**Form name:** AI Receptionist Onboarding
**Send to new clients after payment.**

```
Fields:
1. Business name (text)
2. Primary phone number to forward calls to (phone)
3. Business hours — each day (dropdown or time fields)
4. After-hours message preference:
   [x] AI handles all calls 24/7
   [ ] AI handles after-hours only, ring through during hours
5. Google Calendar email to connect (email)
6. What services do you offer? (paragraph — "Be specific, the AI will know these")
7. Top 5 FAQs customers ask by phone (paragraph)
8. Anything the AI should NEVER say or do? (paragraph)
9. Preferred AI voice style: [Warm & Friendly] [Professional & Direct] [Casual]
10. Emergency/urgent call protocol (paragraph — "What should AI say for emergencies?")
11. Your preferred start date (date)
12. Best time for your test call (date+time)
13. Anything else we should know? (paragraph)
```

---

## PART 4: CLONING A SUB-ACCOUNT FOR A NEW CLIENT

When a new client pays, do this:

1. GHL Agency → Sub-Accounts → **Snapshot** your MASTER TEMPLATE
   (This saves all workflows, templates, and settings as a reusable snapshot)

2. Create new sub-account:
   - Name: "[Client Business Name]"
   - Email: your email (you manage it)
   - Snapshot: select your master template snapshot

3. Customizations (30–45 min per client):
   - [ ] Update business name throughout (GHL Find & Replace helps)
   - [ ] Connect client's phone number (Twilio → import to GHL)
   - [ ] Connect Retell AI agent (configure new agent from your template)
   - [ ] Update calendar hours from onboarding form
   - [ ] Update knowledge base FAQs from onboarding form
   - [ ] Connect their Google Calendar (OAuth in GHL)
   - [ ] Send test call — verify booking flow works
   - [ ] Update Stripe subscription to include their sub-account

4. Client access:
   - Give client a "read-only" GHL user login so they can see their dashboard
   - Show them call recordings tab + appointments tab only
   - They don't need to see automation or pipeline settings

---

## PART 5: STRIPE INTEGRATION

### Setup
1. Connect Stripe in GHL: Settings → Integrations → Stripe
2. Create products in Stripe:
   - "AI Receptionist — Standard Setup" ($1,500 one-time)
   - "AI Receptionist — Standard Monthly" ($2,000/month recurring)
   - "AI Receptionist — Starter Setup" ($750 one-time)
   - "AI Receptionist — Starter Monthly" ($1,200/month recurring)

3. Create payment links for each (Stripe → Payment Links):
   - Setup fee link: collects setup fee only
   - Bundle link (recommended): setup + first month together
   - Monthly subscription link: for recurring billing only

### Automation when payment clears
Stripe → GHL webhook (configure in Stripe → Webhooks → Add endpoint):
```
Event: payment_intent.succeeded
GHL webhook URL: https://[your-ghl-location]/hooks/stripe
Action in GHL: Move opportunity to "Won — Onboarding", trigger Workflow 1 (Welcome)
```

---

## PART 6: PANDADOC CONTRACT SETUP

1. Create account at pandadoc.com (Essentials $19/mo)
2. Create contract template with these fields:
   ```
   [CLIENT_NAME] — merged from GHL
   [CLIENT_BUSINESS] — merged from GHL
   [SERVICE_TIER] — Starter / Standard / Premium
   [SETUP_FEE] — merged from GHL
   [MONTHLY_FEE] — merged from GHL
   [START_DATE] — today + 2 days
   [AGENCY_NAME] — your agency name
   ```
3. Contract content (1 page, plain language):
   - What you deliver (AI receptionist, listed features)
   - Term: Month-to-month
   - Cancellation: 30 days written notice
   - Setup fee: non-refundable after 14 days (refundable within 14 days)
   - Payment: monthly via Stripe on the same date each month
   - Data: client's call data is their property, you handle it securely
4. Connect PandaDoc to GHL via Zapier or PandaDoc's native GHL integration
5. Trigger: Opportunity stage = "Won — Onboarding" → send contract automatically

---

## PART 7: CLIENT DASHBOARD ACCESS

Clients get a simple view in GHL (read-only user):

**What they see:**
- Calendar: all appointments booked by AI
- Conversations: all SMS/call transcripts
- Reports → Calls: total calls, duration, recordings

**What they don't see:**
- Your agency pipeline
- Other clients' data
- Automation settings
- Billing details

Configure in: Sub-Account → Team → Add User → Role: "Read Only"

---

## QUICK REFERENCE: GHL API ENDPOINTS USED IN N8N

```
Base URL: https://rest.gohighlevel.com/v1/

Create contact:     POST /contacts/
Update contact:     PUT  /contacts/{id}
Add note:           POST /contacts/{id}/notes
Add tag:            POST /contacts/{id}/tags
Send SMS:           POST /contacts/{id}/sms
Send email:         POST /contacts/{id}/emails
Get contact:        GET  /contacts/{id}
Create opportunity: POST /pipelines/{pipelineId}/opportunities
Update opportunity: PUT  /pipelines/{pipelineId}/opportunities/{id}
Enroll workflow:    POST /workflows/{workflowId}/enroll
Get appointments:   GET  /appointments/

Headers required:
Authorization: Bearer [YOUR_GHL_API_KEY]
Content-Type: application/json
Version: 2021-04-15
```

Get your API key: GHL → Settings → API Keys → Add Key
```
