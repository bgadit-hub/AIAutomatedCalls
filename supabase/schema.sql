-- ============================================================
-- AI AUTOMATED CALLS — Supabase Schema
-- aiautomatedcalls.com
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── EXTENSIONS ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- Extends auth.users with role + plan info
-- Created automatically on signup via trigger (see bottom)
-- ============================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          text not null check (role in ('admin', 'client')) default 'client',
  full_name     text,
  company_name  text,
  plan          text check (plan in ('Starter', 'Standard', 'Premium')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- CLIENTS
-- Each client = one business using the AI receptionist
-- ============================================================
create table if not exists public.clients (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid references public.profiles(id) on delete set null,
  name          text not null,
  contact_name  text,
  city          text,
  tier          text not null check (tier in ('Starter', 'Standard', 'Premium')) default 'Standard',
  mrr           integer not null default 0,         -- monthly recurring revenue in dollars
  calls_month   integer not null default 0,         -- cached: calls this month
  status        text not null check (status in ('active', 'paused', 'churned')) default 'active',
  agent_status  text not null check (agent_status in ('healthy', 'warn', 'down')) default 'healthy',
  since         date default current_date,
  retell_agent_id text,                             -- Retell AI agent ID
  twilio_number   text,                             -- assigned Twilio number
  ghl_location_id text,                             -- GoHighLevel sub-account ID
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- LEADS (Pipeline)
-- Prospective clients moving through the sales funnel
-- ============================================================
create table if not exists public.leads (
  id            uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_name  text,
  email         text,
  phone         text,
  city          text,
  niche         text,                               -- dental, hvac, law, etc.
  score         integer check (score between 0 and 100) default 50,
  tier          text check (tier in ('Starter', 'Standard', 'Premium')) default 'Standard',
  stage         text not null check (stage in ('cold','demo','ai_called','hot','proposal','won','lost')) default 'cold',
  value         integer default 2000,               -- expected MRR if won
  last_contact  timestamptz,
  loom_watched  boolean default false,
  loom_pct      integer default 0,                  -- % of demo video watched
  retell_called boolean default false,
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- CALL RECORDINGS
-- Every call handled by a client's AI agent
-- ============================================================
create table if not exists public.recordings (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  phone_from    text,
  phone_to      text,
  duration_sec  integer default 0,
  call_type     text not null check (call_type in ('inbound', 'outbound')) default 'inbound',
  outcome       text check (outcome in ('booked', 'info', 'callback', 'no_answer', 'voicemail', 'transferred')),
  transcript    text,
  recording_url text,                               -- Retell AI recording URL
  retell_call_id text,                              -- Retell AI call ID for lookup
  ai_summary    text,                               -- Claude-generated summary
  called_at     timestamptz default now(),
  created_at    timestamptz default now()
);

-- ============================================================
-- APPOINTMENTS
-- Bookings made by the AI receptionist
-- ============================================================
create table if not exists public.appointments (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.clients(id) on delete cascade,
  recording_id    uuid references public.recordings(id) on delete set null,
  patient_name    text,
  phone           text,
  appointment_type text,
  scheduled_at    timestamptz not null,
  status          text not null check (status in ('confirmed', 'pending', 'cancelled', 'no_show', 'completed')) default 'confirmed',
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================
-- CALL STATS (Daily rollup)
-- Pre-aggregated per client per day for fast chart queries
-- Updated by n8n after each call via Supabase REST API
-- ============================================================
create table if not exists public.call_stats (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  stat_date     date not null default current_date,
  total_calls   integer default 0,
  booked        integer default 0,
  outbound      integer default 0,
  no_answer     integer default 0,
  avg_duration  integer default 0,                  -- seconds
  unique (client_id, stat_date)
);

-- ============================================================
-- AD CAMPAIGNS (Social Media)
-- Created via Claude AI Social Ads generator
-- ============================================================
create table if not exists public.ad_campaigns (
  id            uuid primary key default gen_random_uuid(),
  platform      text not null,                      -- Meta, Google, LinkedIn, TikTok
  name          text not null,
  status        text not null check (status in ('active', 'paused', 'ended', 'draft')) default 'draft',
  niche         text,
  target_city   text,
  goal          text,
  tone          text,
  headline      text,
  primary_text  text,
  cta           text,
  hook          text,
  hashtags      text[],
  targeting_tip text,
  spend_cents   integer default 0,                  -- total spend in cents
  impressions   integer default 0,
  clicks        integer default 0,
  leads_gen     integer default 0,
  started_at    timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- AUTOMATIONS (n8n workflow status cache)
-- Updated by n8n webhooks so the dashboard shows live status
-- ============================================================
create table if not exists public.automations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  n8n_workflow_id text,
  status        text not null check (status in ('running', 'warn', 'paused', 'error')) default 'paused',
  runs_today    integer default 0,
  errors_today  integer default 0,
  last_run_at   timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- REVENUE STATS (Monthly rollup for admin charts)
-- ============================================================
create table if not exists public.revenue_stats (
  id            uuid primary key default gen_random_uuid(),
  month_year    text not null unique,               -- e.g. '2025-01'
  total_mrr     integer default 0,
  total_clients integer default 0,
  new_clients   integer default 0,
  churned       integer default 0,
  created_at    timestamptz default now()
);

-- ============================================================
-- INDEXES (performance)
-- ============================================================
create index if not exists idx_recordings_client    on public.recordings(client_id, called_at desc);
create index if not exists idx_appointments_client  on public.appointments(client_id, scheduled_at);
create index if not exists idx_call_stats_client    on public.call_stats(client_id, stat_date desc);
create index if not exists idx_leads_stage          on public.leads(stage, score desc);
create index if not exists idx_clients_status       on public.clients(status);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger on_clients_updated
  before update on public.clients
  for each row execute function public.handle_updated_at();

create or replace trigger on_leads_updated
  before update on public.leads
  for each row execute function public.handle_updated_at();

create or replace trigger on_appointments_updated
  before update on public.appointments
  for each row execute function public.handle_updated_at();

create or replace trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- When a user signs up via Supabase Auth, create their profile row
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role, full_name, company_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'company_name', '')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Admins see everything. Clients see only their own data.
-- ============================================================
alter table public.profiles     enable row level security;
alter table public.clients      enable row level security;
alter table public.leads        enable row level security;
alter table public.recordings   enable row level security;
alter table public.appointments enable row level security;
alter table public.call_stats   enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.automations  enable row level security;
alter table public.revenue_stats enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Helper: get client_id linked to current user
create or replace function public.my_client_id()
returns uuid language sql security definer stable as $$
  select id from public.clients where profile_id = auth.uid() limit 1;
$$;

-- PROFILES policies
create policy "Users can view own profile"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid());

-- CLIENTS policies
create policy "Admins see all clients"
  on public.clients for all
  using (public.is_admin());

create policy "Clients see own record"
  on public.clients for select
  using (profile_id = auth.uid());

-- LEADS policies (admin only)
create policy "Admins manage leads"
  on public.leads for all
  using (public.is_admin());

-- RECORDINGS policies
create policy "Admins see all recordings"
  on public.recordings for all
  using (public.is_admin());

create policy "Clients see own recordings"
  on public.recordings for select
  using (client_id = public.my_client_id());

-- APPOINTMENTS policies
create policy "Admins see all appointments"
  on public.appointments for all
  using (public.is_admin());

create policy "Clients see own appointments"
  on public.appointments for select
  using (client_id = public.my_client_id());

-- CALL STATS policies
create policy "Admins see all stats"
  on public.call_stats for all
  using (public.is_admin());

create policy "Clients see own stats"
  on public.call_stats for select
  using (client_id = public.my_client_id());

-- AD CAMPAIGNS (admin only)
create policy "Admins manage campaigns"
  on public.ad_campaigns for all
  using (public.is_admin());

-- AUTOMATIONS (admin only)
create policy "Admins manage automations"
  on public.automations for all
  using (public.is_admin());

-- REVENUE STATS (admin only)
create policy "Admins see revenue stats"
  on public.revenue_stats for all
  using (public.is_admin());

-- ============================================================
-- SEED DATA
-- Realistic starting data matching the dashboard mock data
-- Run AFTER creating your first admin user in Supabase Auth
-- Replace 'YOUR-ADMIN-USER-UUID' with your actual auth.users id
-- ============================================================

-- Seed revenue stats (8 months of history)
insert into public.revenue_stats (month_year, total_mrr, total_clients, new_clients, churned) values
  ('2024-06', 12400, 5,  5, 0),
  ('2024-07', 18200, 7,  2, 0),
  ('2024-08', 24600, 10, 3, 0),
  ('2024-09', 29800, 13, 3, 0),
  ('2024-10', 35400, 16, 3, 0),
  ('2024-11', 40200, 19, 3, 0),
  ('2024-12', 44800, 22, 3, 0),
  ('2025-01', 48200, 24, 2, 0)
on conflict (month_year) do nothing;

-- Seed clients
insert into public.clients (name, contact_name, city, tier, mrr, calls_month, status, agent_status, since) values
  ('Sunrise Dental',   'Dr. Kim Park',   'Austin TX',      'Standard', 2000, 312, 'active', 'healthy', '2024-10-01'),
  ('Glow Aesthetics',  'Maria Santos',   'Miami FL',       'Premium',  3000, 489, 'active', 'healthy', '2024-11-01'),
  ('CoolAir HVAC',     'Tom Bradley',    'Dallas TX',      'Starter',  1200, 187, 'active', 'healthy', '2024-12-01'),
  ('Rivera Law Firm',  'Carlos Rivera',  'Los Angeles CA', 'Standard', 2000, 234, 'active', 'warn',    '2024-11-01'),
  ('Peak Chiro',       'Amy Chen',       'Denver CO',      'Starter',  1200, 156, 'active', 'healthy', '2025-01-01'),
  ('LuxDerm Clinic',   'Rachel Park',    'New York NY',    'Premium',  3000, 521, 'active', 'healthy', '2024-09-01'),
  ('Smith Plumbing',   'Bob Smith',      'Seattle WA',     'Starter',  1200, 98,  'paused', 'warn',    '2024-12-01'),
  ('Realty One',       'James Wu',       'Phoenix AZ',     'Standard', 2000, 267, 'active', 'healthy', '2025-01-01')
on conflict do nothing;

-- Seed pipeline leads
insert into public.leads (business_name, contact_name, city, niche, score, tier, stage, value, last_contact) values
  ('Sunrise Dental',    'Dr. Kim Park',  'Austin TX',    'Dental',     92, 'Standard', 'hot',      2000, now() - interval '2 hours'),
  ('Realty One Group',  'James Wu',      'Phoenix AZ',   'Real Estate',78, 'Premium',  'proposal', 3000, now() - interval '1 day'),
  ('CoolAir Services',  'Tom Bradley',   'Dallas TX',    'HVAC',       65, 'Starter',  'ai_called',1200, now() - interval '3 hours'),
  ('Glow Aesthetics',   'Maria Santos',  'Miami FL',     'Med Spa',    88, 'Standard', 'hot',      2000, now() - interval '5 hours'),
  ('Rivera Law',        'Carlos Rivera', 'Los Angeles CA','Law',       45, 'Standard', 'demo',     2000, now() - interval '2 days'),
  ('Peak Performance',  'Amy Chen',      'Denver CO',    'Chiro',      71, 'Starter',  'ai_called',1200, now() - interval '1 hour'),
  ('Smith & Sons',      'Bob Smith',     'Seattle WA',   'Plumbing',   55, 'Starter',  'cold',     1200, now() - interval '4 days'),
  ('LuxDerm',           'Rachel Park',   'New York NY',  'Med Spa',    95, 'Premium',  'won',      3000, now() - interval '6 hours')
on conflict do nothing;

-- Seed automations
insert into public.automations (name, description, status, runs_today, errors_today, last_run_at) values
  ('Lead Trigger → Sales Call',  'Email click → enrich → Retell call dispatch',    'running', 47, 0, now() - interval '2 minutes'),
  ('Post-Call Processor',        'Transcript → Claude analysis → GHL routing',      'running', 47, 0, now() - interval '4 minutes'),
  ('Monthly ROI Reports',        'Pull Retell stats → format → email clients',       'running',  0, 0, now() - interval '1 day'),
  ('Referral Engine',            'Day-30 referral ask sequence',                     'running',  3, 0, now() - interval '12 hours'),
  ('No-Answer Retry',            '3-attempt retry at 10am / 2pm / 6pm',             'warn',    12, 2, now() - interval '1 hour'),
  ('90-Day Reactivation',        'Re-engage cold leads after 90 days',               'paused',   0, 0, now() - interval '3 days')
on conflict do nothing;

-- Seed ad campaigns
insert into public.ad_campaigns (platform, name, status, niche, target_city, spend_cents, impressions, clicks, leads_gen) values
  ('Meta',     'Dental Offices — Austin',    'active', 'Dental',     'Austin TX',    1840, 4820, 142,  7),
  ('Google',   'AI Receptionist — Phoenix',  'active', 'Real Estate','Phoenix AZ',   2410, 3210, 198, 11),
  ('LinkedIn', 'Med Spa Owners — Miami',     'paused', 'Med Spa',    'Miami FL',     3100, 1840,  87,  5),
  ('Meta',     'Law Firms — LA',             'active', 'Law',        'Los Angeles CA',1280, 2940, 109,  4)
on conflict do nothing;

-- ============================================================
-- USEFUL VIEWS (optional, for easy querying)
-- ============================================================

-- Admin overview: totals at a glance
create or replace view public.admin_overview as
select
  count(*)                                          as total_clients,
  sum(mrr)                                          as total_mrr,
  count(*) filter (where status = 'active')         as active_clients,
  count(*) filter (where agent_status = 'warn')     as agents_warning,
  count(*) filter (where agent_status = 'down')     as agents_down
from public.clients;

-- Client call summary for current month
create or replace view public.client_monthly_summary as
select
  c.id            as client_id,
  c.name          as client_name,
  c.tier,
  c.mrr,
  coalesce(sum(cs.total_calls), 0)  as calls_month,
  coalesce(sum(cs.booked), 0)       as booked_month,
  coalesce(sum(cs.outbound), 0)     as outbound_month
from public.clients c
left join public.call_stats cs on cs.client_id = c.id
  and cs.stat_date >= date_trunc('month', current_date)
group by c.id, c.name, c.tier, c.mrr;
