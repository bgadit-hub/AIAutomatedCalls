# SCHEMA.md — AI Automated Calls: Complete Database Schema

> Last updated: 2026-05-11 (Session 6)
> Supabase: `tkqxwgmkqfusyzrdgacz` | us-east-1
> **Never assume a column exists. Always check here before writing queries.**

---

## Table Index

| Table | Purpose |
|-------|---------|
| `profiles` | Extended user data (auth.users) |
| `clients` | Paying client businesses |
| `leads` | Our own sales prospects (Layer 1) |
| `calls` | Every call — Layer 1 and Layer 2 |
| `appointments` | Appointments booked by AI |
| `agents` | Vapi agent configs per client |
| `subscriptions` | Billing plans |
| `call_transcripts` | Full transcripts + AI analysis |
| `agent_templates` | Industry script templates |
| `notifications` | In-app + email queue |
| `availability` | Client weekly availability schedule |
| `booking_settings` | Per-client booking page configuration |

---

## profiles
```sql
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin','client')),
  full_name   TEXT,
  email       TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  client_id   UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "admin all" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "update own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
```

## clients
```sql
CREATE TABLE public.clients (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name       TEXT NOT NULL,
  industry            TEXT NOT NULL CHECK (industry IN ('dental','real_estate','hvac','law','med_spa','chiro','other')),
  contact_name        TEXT NOT NULL,
  contact_email       TEXT NOT NULL UNIQUE,
  contact_phone       TEXT,
  website             TEXT,
  address             TEXT,
  business_hours      JSONB,
  status              TEXT NOT NULL DEFAULT 'onboarding' CHECK (status IN ('onboarding','active','paused','churned')),
  plan                TEXT NOT NULL DEFAULT 'standard' CHECK (plan IN ('starter','standard','premium')),
  setup_fee_paid      BOOLEAN NOT NULL DEFAULT FALSE,
  monthly_fee         INTEGER,
  phone_number        TEXT,           -- Vapi number assigned to this client
  vapi_number_id      TEXT,           -- Vapi phone number ID
  vapi_agent_id       TEXT,           -- Vapi agent ID
  gcal_refresh_token  TEXT,           -- Google Calendar OAuth token (P1)
  ghl_contact_id      TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all" ON public.clients FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "client own" ON public.clients FOR SELECT USING (
  id = (SELECT client_id FROM public.profiles WHERE id = auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
```

## leads
```sql
CREATE TABLE public.leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  phone           TEXT NOT NULL,
  email           TEXT,
  business_name   TEXT,
  business_type   TEXT,
  pain_point      TEXT,
  source          TEXT NOT NULL DEFAULT 'website' CHECK (source IN ('website','referral','cold_email','social','other')),
  status          TEXT NOT NULL DEFAULT 'new' CHECK (status IN (
                    'new','calling','called','voicemail','no_answer',
                    'qualified','disqualified','demo_booked','closed_won','closed_lost')),
  call_attempts   INTEGER NOT NULL DEFAULT 0,
  last_called_at  TIMESTAMPTZ,
  demo_booked_at  TIMESTAMPTZ,
  demo_date       TIMESTAMPTZ,
  qualified_score INTEGER,
  ghl_contact_id  TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all" ON public.leads FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
```

## calls
```sql
CREATE TABLE public.calls (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer            TEXT NOT NULL CHECK (layer IN ('layer1','layer2')),
  client_id        UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  lead_id          UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  vapi_call_id     TEXT UNIQUE,
  direction        TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  caller_phone     TEXT,
  called_phone     TEXT,
  status           TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN (
                     'initiated','in_progress','completed','voicemail','no_answer','failed','transferred')),
  duration_seconds INTEGER,
  recording_url    TEXT,
  recording_expires TIMESTAMPTZ,
  outcome          TEXT,
  sentiment        TEXT CHECK (sentiment IN ('positive','neutral','negative')),
  sentiment_score  NUMERIC(3,2),
  transfer_number  TEXT,
  voicemail_left   BOOLEAN DEFAULT FALSE,
  cost_cents       INTEGER,
  agent_id         UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  started_at       TIMESTAMPTZ,
  ended_at         TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_calls_client_id    ON public.calls(client_id);
CREATE INDEX idx_calls_lead_id      ON public.calls(lead_id);
CREATE INDEX idx_calls_vapi_call_id ON public.calls(vapi_call_id);
CREATE INDEX idx_calls_created_at   ON public.calls(created_at DESC);
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all" ON public.calls FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "client own" ON public.calls FOR SELECT USING (
  client_id = (SELECT client_id FROM public.profiles WHERE id = auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calls TO authenticated;
```

## call_transcripts
```sql
CREATE TABLE public.call_transcripts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id      UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  transcript   TEXT NOT NULL,
  summary      TEXT,
  key_moments  JSONB,
  missed_opps  JSONB,
  ai_notes     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_transcripts_call_id ON public.call_transcripts(call_id);
ALTER TABLE public.call_transcripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all" ON public.call_transcripts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "client own" ON public.call_transcripts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.calls c JOIN public.profiles p ON p.client_id = c.client_id
          WHERE c.id = call_id AND p.id = auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_transcripts TO authenticated;
```

## appointments
```sql
CREATE TABLE public.appointments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  call_id           UUID REFERENCES public.calls(id) ON DELETE SET NULL,
  lead_id           UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  patient_name      TEXT NOT NULL,
  patient_phone     TEXT,
  patient_email     TEXT,
  appointment_type  TEXT,
  scheduled_at      TIMESTAMPTZ NOT NULL,
  duration_minutes  INTEGER DEFAULT 30,
  status            TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked','confirmed','cancelled','completed','no_show')),
  calendar_event_id TEXT,
  calendar_source   TEXT CHECK (calendar_source IN ('native','ical','google','manual')),
  ical_uid          TEXT,             -- unique ID in the .ics file for updates/cancellations
  confirmation_sent BOOLEAN DEFAULT FALSE,
  reminder_sent     BOOLEAN DEFAULT FALSE,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_appointments_client_id    ON public.appointments(client_id);
CREATE INDEX idx_appointments_scheduled_at ON public.appointments(scheduled_at);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all" ON public.appointments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "client own" ON public.appointments FOR SELECT USING (
  client_id = (SELECT client_id FROM public.profiles WHERE id = auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
```

## agents
```sql
CREATE TABLE public.agents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  vapi_agent_id     TEXT UNIQUE,
  name              TEXT NOT NULL,
  industry          TEXT NOT NULL,
  use_case          TEXT NOT NULL CHECK (use_case IN (
                      'appointment_booking','lead_qualification','faq_answering','inbound_reception','outbound_followup')),
  voice_id          TEXT,             -- ElevenLabs voice ID
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
  client_id = (SELECT client_id FROM public.profiles WHERE id = auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agents TO authenticated;
```

## subscriptions
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
  client_id = (SELECT client_id FROM public.profiles WHERE id = auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
```

## agent_templates
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

## notifications
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
CREATE INDEX idx_notifications_unread  ON public.notifications(read) WHERE read = FALSE;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON public.notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "admin all" ON public.notifications FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
```

## availability
Per-client weekly availability schedule for native booking system.
```sql
CREATE TABLE public.availability (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  day_of_week  INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 6=Sat
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_availability_client_id ON public.availability(client_id);
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all" ON public.availability FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "client own" ON public.availability FOR ALL USING (
  client_id = (SELECT client_id FROM public.profiles WHERE id = auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability TO authenticated;
```

## booking_settings
Per-client booking page configuration.
```sql
CREATE TABLE public.booking_settings (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id            UUID NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
  booking_url_slug     TEXT UNIQUE,           -- e.g. "sunrise-dental" → /book/sunrise-dental
  appointment_types    JSONB,                  -- [{name: "New Patient", duration: 60}, ...]
  appointment_duration INTEGER NOT NULL DEFAULT 30,   -- default minutes
  buffer_time          INTEGER NOT NULL DEFAULT 15,   -- minutes between appointments
  advance_booking_days INTEGER NOT NULL DEFAULT 30,   -- how far ahead bookable
  min_notice_hours     INTEGER NOT NULL DEFAULT 2,    -- minimum notice required
  timezone             TEXT NOT NULL DEFAULT 'America/New_York',
  page_title           TEXT,                  -- e.g. "Book with Sunrise Dental"
  page_subtitle        TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.booking_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all" ON public.booking_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "client own" ON public.booking_settings FOR ALL USING (
  client_id = (SELECT client_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "public read" ON public.booking_settings FOR SELECT USING (TRUE);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_settings TO authenticated;
```

---

## Functions & Triggers

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_clients_updated_at         BEFORE UPDATE ON public.clients         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_leads_updated_at           BEFORE UPDATE ON public.leads           FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_calls_updated_at           BEFORE UPDATE ON public.calls           FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_agents_updated_at          BEFORE UPDATE ON public.agents          FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_appointments_updated_at    BEFORE UPDATE ON public.appointments    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_subscriptions_updated_at   BEFORE UPDATE ON public.subscriptions   FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_availability_updated_at    BEFORE UPDATE ON public.availability    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_booking_settings_updated_at BEFORE UPDATE ON public.booking_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

---

## Migration Checklist
- [ ] Verify column doesn't already exist
- [ ] GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO authenticated
- [ ] RLS policies for admin and client roles
- [ ] updated_at trigger if applicable
- [ ] Update this file after migration runs

## Tables Applied vs Pending

| Table | Status |
|-------|--------|
| `profiles` | ✅ Applied (Session 2) |
| `clients` | ✅ Applied (Session 2) |
| `leads` | ✅ Applied (Session 2) |
| `calls` | ✅ Applied (Session 2) |
| `appointments` | ✅ Applied (Session 2) |
| `agents` | ❌ Pending |
| `subscriptions` | ❌ Pending |
| `call_transcripts` | ❌ Pending |
| `agent_templates` | ❌ Pending |
| `notifications` | ❌ Pending |
| `availability` | ❌ Pending (new — Session 6) |
| `booking_settings` | ❌ Pending (new — Session 6) |
