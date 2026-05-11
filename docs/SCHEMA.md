# SCHEMA.md — AI Automated Calls: Complete Database Schema

> Last updated: 2026-05-11 (Session 6 — corrected to match actual DB state)
> Supabase: `tkqxwgmkqfusyzrdgacz` | us-east-1
> **Never assume a column exists. Always check this file before writing queries.**
> **IMPORTANT: This file now reflects ACTUAL database state, not ideal spec.**

---

## Table Index

| Table | Status | Purpose |
|-------|--------|---------|
| `profiles` | ✅ Exists | User roles and metadata |
| `clients` | ✅ Exists | Paying client businesses |
| `leads` | ✅ Exists | Our own sales prospects (Layer 1) |
| `recordings` | ✅ Exists | **This is the calls table** — every call record |
| `appointments` | ✅ Exists | Appointments booked by AI |
| `ad_campaigns` | ✅ Exists | Claude-generated ad campaigns |
| `automations` | ✅ Exists | n8n workflow tracking |
| `call_stats` | ✅ Exists | Daily aggregated call stats per client |
| `revenue_stats` | ✅ Exists | Monthly revenue tracking |
| `admin_overview` | ✅ Exists | View — admin dashboard aggregates |
| `client_monthly_summary` | ✅ Exists | View — per-client monthly rollup |
| `agents` | ❌ Pending | Vapi agent configs per client |
| `call_transcripts` | ❌ Pending | Structured transcript + AI analysis |
| `agent_templates` | ❌ Pending | Industry script presets |
| `notifications` | ❌ Pending | In-app + email queue |
| `subscriptions` | ❌ Pending | Billing plans |
| `availability` | ❌ Pending | Client weekly availability for booking |
| `booking_settings` | ❌ Pending | Per-client booking page config |

---

## EXISTING TABLES (Actual Columns)

### `profiles`
```sql
-- ACTUAL columns as of Session 2:
id          UUID PRIMARY KEY (references auth.users)
role        TEXT NOT NULL DEFAULT 'client'  -- 'admin' or 'client'
full_name   TEXT
company_name TEXT
plan        TEXT
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ

-- MISSING from spec (to add via migration):
-- email, phone, avatar_url, client_id
```

### `clients`
```sql
-- ACTUAL columns as of Session 2:
id              UUID PRIMARY KEY
profile_id      UUID  -- references profiles(id)
name            TEXT NOT NULL  -- NOTE: 'name' not 'business_name'
contact_name    TEXT
city            TEXT
tier            TEXT DEFAULT 'Standard'  -- NOTE: 'tier' not 'plan'; values: 'Starter','Standard','Premium'
mrr             INTEGER DEFAULT 0  -- monthly recurring revenue in dollars
calls_month     INTEGER DEFAULT 0
status          TEXT DEFAULT 'active'  -- 'active','paused','churned'
agent_status    TEXT DEFAULT 'healthy'  -- 'healthy','warning','down'
since           DATE
retell_agent_id TEXT  -- OLD: Retell agent ID (to be replaced by vapi_agent_id)
twilio_number   TEXT  -- phone number
ghl_location_id TEXT
notes           TEXT
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ

-- MISSING from spec (to add via migration):
-- industry, contact_email, business_hours, vapi_agent_id, vapi_number_id,
-- setup_fee_paid, monthly_fee, gcal_refresh_token, website, address
```

### `leads`
```sql
-- ACTUAL columns as of Session 2:
id           UUID PRIMARY KEY
business_name TEXT NOT NULL
contact_name  TEXT
email         TEXT
phone         TEXT
city          TEXT
niche         TEXT  -- industry/niche type
score         INTEGER DEFAULT 50  -- lead score 0-100
tier          TEXT DEFAULT 'Standard'  -- target plan
stage         TEXT DEFAULT 'cold'  -- pipeline stage: 'cold','contacted','demo_booked','won','lost'
value         INTEGER DEFAULT 2000  -- estimated deal value
last_contact  TIMESTAMPTZ
loom_watched  BOOLEAN DEFAULT false
loom_pct      INTEGER DEFAULT 0  -- % of Loom video watched
retell_called BOOLEAN DEFAULT false  -- OLD: to be replaced by vapi_called
notes         TEXT
created_at    TIMESTAMPTZ
updated_at    TIMESTAMPTZ

-- MISSING from spec (to add via migration):
-- pain_point, source, call_status, call_attempts, last_called_at,
-- demo_booked_at, demo_date, qualified_score, ghl_contact_id, vapi_called
```

### `recordings` (this is our calls table)
```sql
-- ACTUAL columns as of Session 2:
id              UUID PRIMARY KEY
client_id       UUID  -- references clients(id)
phone_from      TEXT
phone_to        TEXT
duration_sec    INTEGER DEFAULT 0
call_type       TEXT DEFAULT 'inbound'  -- 'inbound','outbound'
outcome         TEXT
transcript      TEXT
recording_url   TEXT
retell_call_id  TEXT  -- OLD: Retell call ID (to be replaced by vapi_call_id)
ai_summary      TEXT
called_at       TIMESTAMPTZ
created_at      TIMESTAMPTZ

-- MISSING (to add via migration):
-- vapi_call_id, layer, lead_id, direction (keep call_type), sentiment,
-- sentiment_score, transfer_number, voicemail_left, cost_cents, agent_id,
-- started_at, ended_at, status
```

### `appointments`
```sql
-- ACTUAL columns as of Session 2:
id               UUID PRIMARY KEY
client_id        UUID  -- references clients(id)
recording_id     UUID  -- references recordings(id) -- NOTE: 'recording_id' not 'call_id'
patient_name     TEXT
phone            TEXT  -- NOTE: 'phone' not 'patient_phone'
appointment_type TEXT
scheduled_at     TIMESTAMPTZ NOT NULL
status           TEXT DEFAULT 'confirmed'  -- 'confirmed','cancelled','completed','no_show'
notes            TEXT
created_at       TIMESTAMPTZ
updated_at       TIMESTAMPTZ

-- MISSING (to add via migration):
-- lead_id, patient_email, duration_minutes, calendar_source, calendar_event_id,
-- ical_uid, confirmation_sent, reminder_sent
```

### `ad_campaigns`
```sql
-- ACTUAL columns (fully built in Session 2):
id           UUID PRIMARY KEY
platform     TEXT NOT NULL  -- 'Facebook','Instagram','Google', etc
name         TEXT NOT NULL
status       TEXT DEFAULT 'draft'
niche        TEXT
target_city  TEXT
goal         TEXT
tone         TEXT
headline     TEXT
primary_text TEXT
cta          TEXT
hook         TEXT
hashtags     TEXT[]
targeting_tip TEXT
spend_cents  INTEGER DEFAULT 0
impressions  INTEGER DEFAULT 0
clicks       INTEGER DEFAULT 0
leads_gen    INTEGER DEFAULT 0
started_at   TIMESTAMPTZ
created_at   TIMESTAMPTZ
updated_at   TIMESTAMPTZ
```

### `automations`
```sql
-- ACTUAL columns (fully built in Session 2):
id              UUID PRIMARY KEY
name            TEXT NOT NULL
description     TEXT
n8n_workflow_id TEXT
status          TEXT DEFAULT 'paused'  -- 'active','paused','error'
runs_today      INTEGER DEFAULT 0
errors_today    INTEGER DEFAULT 0
last_run_at     TIMESTAMPTZ
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

### `call_stats`
```sql
-- ACTUAL columns (fully built in Session 2):
id          UUID PRIMARY KEY
client_id   UUID  -- references clients(id)
stat_date   DATE DEFAULT CURRENT_DATE
total_calls INTEGER DEFAULT 0
booked      INTEGER DEFAULT 0
outbound    INTEGER DEFAULT 0
no_answer   INTEGER DEFAULT 0
avg_duration INTEGER DEFAULT 0
```

### `revenue_stats`
```sql
-- ACTUAL columns (fully built in Session 2):
id            UUID PRIMARY KEY
month_year    TEXT NOT NULL  -- e.g. 'May 2026'
total_mrr     INTEGER DEFAULT 0
total_clients INTEGER DEFAULT 0
new_clients   INTEGER DEFAULT 0
churned       INTEGER DEFAULT 0
created_at    TIMESTAMPTZ
```

---

## PENDING MIGRATIONS

### Migration 1: Add Vapi columns to `clients`
```sql
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS business_hours JSONB,
  ADD COLUMN IF NOT EXISTS setup_fee_paid BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS monthly_fee INTEGER,
  ADD COLUMN IF NOT EXISTS vapi_agent_id TEXT,
  ADD COLUMN IF NOT EXISTS vapi_number_id TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS gcal_refresh_token TEXT;
```

### Migration 2: Add Vapi columns to `leads`
```sql
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS pain_point TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website',
  ADD COLUMN IF NOT EXISTS call_status TEXT DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS call_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_called_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS demo_booked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS demo_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS qualified_score INTEGER,
  ADD COLUMN IF NOT EXISTS ghl_contact_id TEXT,
  ADD COLUMN IF NOT EXISTS vapi_called BOOLEAN DEFAULT FALSE;
```

### Migration 3: Add Vapi columns to `recordings`
```sql
ALTER TABLE public.recordings
  ADD COLUMN IF NOT EXISTS vapi_call_id TEXT,
  ADD COLUMN IF NOT EXISTS layer TEXT DEFAULT 'layer2',
  ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sentiment TEXT,
  ADD COLUMN IF NOT EXISTS sentiment_score NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS transfer_number TEXT,
  ADD COLUMN IF NOT EXISTS voicemail_left BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cost_cents INTEGER,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS call_status TEXT DEFAULT 'completed';
CREATE UNIQUE INDEX IF NOT EXISTS idx_recordings_vapi_call_id ON public.recordings(vapi_call_id) WHERE vapi_call_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recordings_client_id ON public.recordings(client_id);
CREATE INDEX IF NOT EXISTS idx_recordings_called_at ON public.recordings(called_at DESC);
```

### Migration 4: Add columns to `appointments`
```sql
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS patient_email TEXT,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS calendar_source TEXT DEFAULT 'native',
  ADD COLUMN IF NOT EXISTS calendar_event_id TEXT,
  ADD COLUMN IF NOT EXISTS ical_uid TEXT,
  ADD COLUMN IF NOT EXISTS confirmation_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;
```

### Migration 5: Create `agents`
```sql
CREATE TABLE public.agents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  vapi_agent_id     TEXT UNIQUE,
  name              TEXT NOT NULL,
  industry          TEXT NOT NULL,
  use_case          TEXT NOT NULL CHECK (use_case IN (
                      'appointment_booking','lead_qualification','faq_answering',
                      'inbound_reception','outbound_followup')),
  voice_id          TEXT,
  voice_model       TEXT DEFAULT 'eleven_flash_v2_5',
  greeting_script   TEXT,
  system_prompt     TEXT,
  knowledge_base    TEXT,
  escalation_number TEXT,
  tools_enabled     JSONB,
  calendar_source   TEXT CHECK (calendar_source IN ('native','google','none')),
  is_active         BOOLEAN NOT NULL DEFAULT FALSE,
  call_count        INTEGER NOT NULL DEFAULT 0,
  total_minutes     NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all" ON public.agents FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "client own" ON public.agents FOR SELECT USING (
  client_id IN (SELECT id FROM public.clients WHERE profile_id = auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agents TO authenticated;
```

### Migration 6: Create `call_transcripts`
```sql
CREATE TABLE public.call_transcripts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL REFERENCES public.recordings(id) ON DELETE CASCADE,
  transcript   TEXT NOT NULL,
  summary      TEXT,
  key_moments  JSONB,
  missed_opps  JSONB,
  ai_notes     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_transcripts_recording_id ON public.call_transcripts(recording_id);
ALTER TABLE public.call_transcripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all" ON public.call_transcripts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "client own" ON public.call_transcripts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.recordings r
          JOIN public.clients c ON c.id = r.client_id
          WHERE r.id = recording_id AND c.profile_id = auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_transcripts TO authenticated;
```

### Migration 7: Create `agent_templates`
```sql
CREATE TABLE public.agent_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry        TEXT NOT NULL,
  use_case        TEXT NOT NULL,
  name            TEXT NOT NULL,
  greeting_script TEXT NOT NULL,
  system_prompt   TEXT NOT NULL,
  knowledge_base  TEXT,
  tools_enabled   JSONB,
  voice_id        TEXT,
  voice_model     TEXT DEFAULT 'eleven_flash_v2_5',
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.agent_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON public.agent_templates FOR SELECT USING (TRUE);
CREATE POLICY "admin all" ON public.agent_templates FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_templates TO authenticated;
```

### Migration 8: Create `notifications`
```sql
CREATE TABLE public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id  UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN (
               'call_completed','appointment_booked','appointment_cancelled',
               'call_missed','agent_error','billing','new_lead')),
  title      TEXT NOT NULL,
  body       TEXT,
  data       JSONB,
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  sent_email BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(read) WHERE read = FALSE;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON public.notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "admin all" ON public.notifications FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
```

### Migration 9: Create `subscriptions`
```sql
CREATE TABLE public.subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id            UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  plan                 TEXT NOT NULL CHECK (plan IN ('starter','standard','premium')),
  status               TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('trialing','active','past_due','cancelled')),
  setup_fee_cents      INTEGER NOT NULL,
  monthly_fee_cents    INTEGER NOT NULL,
  billing_cycle_day    INTEGER DEFAULT 1,
  stripe_customer_id   TEXT,
  stripe_sub_id        TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  minutes_included     INTEGER NOT NULL,
  minutes_used         INTEGER NOT NULL DEFAULT 0,
  overage_rate_cents   INTEGER DEFAULT 5,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all" ON public.subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "client own" ON public.subscriptions FOR SELECT USING (
  client_id IN (SELECT id FROM public.clients WHERE profile_id = auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
```

### Migration 10: Create `availability`
```sql
CREATE TABLE public.availability (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sun, 6=Sat
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_availability_client_id ON public.availability(client_id);
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all" ON public.availability FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "client own" ON public.availability FOR ALL USING (
  client_id IN (SELECT id FROM public.clients WHERE profile_id = auth.uid()));
CREATE POLICY "public read" ON public.availability FOR SELECT USING (TRUE);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability TO authenticated;
```

### Migration 11: Create `booking_settings`
```sql
CREATE TABLE public.booking_settings (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id            UUID NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
  booking_url_slug     TEXT UNIQUE,
  appointment_types    JSONB,
  appointment_duration INTEGER NOT NULL DEFAULT 30,
  buffer_time          INTEGER NOT NULL DEFAULT 15,
  advance_booking_days INTEGER NOT NULL DEFAULT 30,
  min_notice_hours     INTEGER NOT NULL DEFAULT 2,
  timezone             TEXT NOT NULL DEFAULT 'America/New_York',
  page_title           TEXT,
  page_subtitle        TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.booking_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all" ON public.booking_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "client own" ON public.booking_settings FOR ALL USING (
  client_id IN (SELECT id FROM public.clients WHERE profile_id = auth.uid()));
CREATE POLICY "public read" ON public.booking_settings FOR SELECT USING (TRUE);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_settings TO authenticated;
```

---

## Key Naming Differences (Real vs Spec)

| What spec called | What DB actually has | Notes |
|-----------------|---------------------|-------|
| `calls` table | `recordings` table | Same thing, different name |
| `clients.business_name` | `clients.name` | Use `name` in all queries |
| `clients.plan` | `clients.tier` | Values: 'Starter','Standard','Premium' |
| `recordings.call_type` | `recordings.call_type` | 'inbound' or 'outbound' |
| `appointments.call_id` | `appointments.recording_id` | References recordings table |
| `appointments.patient_phone` | `appointments.phone` | Shorter column name |
| `leads.status` | `leads.stage` | Pipeline stage |
| `clients.vapi_agent_id` | `clients.retell_agent_id` | Old Retell col, add vapi_agent_id |

## Migration Checklist
- [ ] Verify column doesn't already exist before ALTER TABLE
- [ ] GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO authenticated
- [ ] RLS policies matching actual profile/client relationship
- [ ] Note: RLS uses `clients.profile_id = auth.uid()` (not `profiles.client_id`)
- [ ] Update this file after each migration runs
