// ============================================================
// src/lib/api.js
// All data fetching functions.
// Each function replaces one mock array in AIAutomatedCalls.jsx
// Import what you need: import { getClients, getLeads } from './api'
// ============================================================
import { supabase } from './supabase';

// ── HELPERS ──────────────────────────────────────────────────

function throwOnError({ data, error }) {
  if (error) throw error;
  return data;
}

// ── AUTH ─────────────────────────────────────────────────────

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data; // { user, session }
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getProfile(userId) {
  return throwOnError(
    await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
  );
}

// ── ADMIN: OVERVIEW ──────────────────────────────────────────

// KPI cards on the Admin Overview page
export async function getAdminKPIs() {
  const [clientsRes, leadsRes] = await Promise.all([
    supabase.from('clients').select('id, mrr, status, agent_status'),
    supabase.from('leads').select('id, stage'),
  ]);

  const clients = clientsRes.data || [];
  const leads   = leadsRes.data || [];

  return {
    totalClients:  clients.filter(c => c.status === 'active').length,
    totalMRR:      clients.reduce((s, c) => s + (c.mrr || 0), 0),
    leadsInPipeline: leads.filter(l => !['won','lost'].includes(l.stage)).length,
    hotLeads:      leads.filter(l => l.stage === 'hot').length,
    agentsWarning: clients.filter(c => c.agent_status === 'warn').length,
  };
}

// Revenue area chart data (last 8 months)
export async function getRevenueHistory() {
  return throwOnError(
    await supabase
      .from('revenue_stats')
      .select('month_year, total_mrr, total_clients')
      .order('month_year', { ascending: true })
      .limit(8)
  );
}

// ── ADMIN: CLIENTS ────────────────────────────────────────────

export async function getClients({ search = '' } = {}) {
  let query = supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,contact_name.ilike.%${search}%,city.ilike.%${search}%`
    );
  }

  return throwOnError(await query);
}

export async function getClient(id) {
  return throwOnError(
    await supabase.from('clients').select('*').eq('id', id).single()
  );
}

export async function addClient(data) {
  return throwOnError(
    await supabase.from('clients').insert(data).select().single()
  );
}

export async function updateClient(id, data) {
  return throwOnError(
    await supabase.from('clients').update(data).eq('id', id).select().single()
  );
}

// ── ADMIN: LEADS (PIPELINE) ───────────────────────────────────

export async function getLeads() {
  return throwOnError(
    await supabase
      .from('leads')
      .select('*')
      .not('stage', 'eq', 'lost')
      .order('score', { ascending: false })
  );
}

export async function moveLead(id, newStage) {
  return throwOnError(
    await supabase
      .from('leads')
      .update({ stage: newStage, last_contact: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
  );
}

export async function addLead(data) {
  return throwOnError(
    await supabase.from('leads').insert(data).select().single()
  );
}

// ── ADMIN: ANALYTICS ─────────────────────────────────────────

export async function getAnalytics() {
  const [revenueRes, clientsRes] = await Promise.all([
    supabase
      .from('revenue_stats')
      .select('*')
      .order('month_year', { ascending: true })
      .limit(8),
    supabase
      .from('clients')
      .select('tier, mrr, status')
  ]);

  const clients = clientsRes.data || [];
  const byTier = clients.reduce((acc, c) => {
    acc[c.tier] = (acc[c.tier] || 0) + 1;
    return acc;
  }, {});

  return {
    revenueHistory: revenueRes.data || [],
    clientsByTier: byTier,
    avgRetainer: clients.length
      ? Math.round(clients.reduce((s, c) => s + c.mrr, 0) / clients.length)
      : 0,
  };
}

// ── ADMIN: AI AGENTS ─────────────────────────────────────────

// Returns clients enriched with today's call stats
export async function getAgentHealth() {
  const today = new Date().toISOString().split('T')[0];

  const [clientsRes, statsRes] = await Promise.all([
    supabase.from('clients').select('*').order('name'),
    supabase
      .from('call_stats')
      .select('client_id, total_calls, booked')
      .eq('stat_date', today),
  ]);

  const statsByClient = (statsRes.data || []).reduce((acc, s) => {
    acc[s.client_id] = s;
    return acc;
  }, {});

  return (clientsRes.data || []).map(c => ({
    ...c,
    callsToday: statsByClient[c.id]?.total_calls || 0,
    bookedToday: statsByClient[c.id]?.booked || 0,
  }));
}

// ── ADMIN: AUTOMATIONS ────────────────────────────────────────

export async function getAutomations() {
  return throwOnError(
    await supabase.from('automations').select('*').order('name')
  );
}

export async function updateAutomationStatus(id, status) {
  return throwOnError(
    await supabase
      .from('automations')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
  );
}

// Called by n8n webhooks to log run stats
export async function logAutomationRun(id, { success }) {
  const col = success ? 'runs_today' : 'errors_today';
  return throwOnError(
    await supabase.rpc('increment_automation', { row_id: id, col_name: col })
  );
}

// ── ADMIN: SOCIAL ADS ─────────────────────────────────────────

export async function getCampaigns() {
  return throwOnError(
    await supabase
      .from('ad_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
  );
}

export async function saveCampaign(data) {
  return throwOnError(
    await supabase.from('ad_campaigns').insert(data).select().single()
  );
}

export async function updateCampaign(id, data) {
  return throwOnError(
    await supabase
      .from('ad_campaigns')
      .update(data)
      .eq('id', id)
      .select()
      .single()
  );
}

// Generate ad copy via Cloudflare Pages Function (proxies Anthropic API)
export async function generateAdCopy({ platform, niche, city, goal, tone }) {
  const res = await fetch('/api/generate-ad', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform, niche, city, goal, tone }),
  });
  if (!res.ok) throw new Error('Ad generation failed');
  return res.json();
}

// ── CLIENT: DASHBOARD ─────────────────────────────────────────

// Get the client record linked to the logged-in user
export async function getMyClient() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  return throwOnError(
    await supabase
      .from('clients')
      .select('*')
      .eq('profile_id', user.id)
      .single()
  );
}

// 14-day call volume chart for client dashboard
export async function getMyCallStats(clientId) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);

  return throwOnError(
    await supabase
      .from('call_stats')
      .select('stat_date, total_calls, booked')
      .eq('client_id', clientId)
      .gte('stat_date', cutoff.toISOString().split('T')[0])
      .order('stat_date', { ascending: true })
  );
}

// This week's summary numbers
export async function getMyWeekSummary(clientId) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  return throwOnError(
    await supabase
      .from('call_stats')
      .select('total_calls, booked, outbound, no_answer')
      .eq('client_id', clientId)
      .gte('stat_date', weekAgo.toISOString().split('T')[0])
  );
}

// ── CLIENT: RECORDINGS ────────────────────────────────────────

export async function getMyRecordings(clientId, { limit = 20, offset = 0 } = {}) {
  return throwOnError(
    await supabase
      .from('recordings')
      .select('*')
      .eq('client_id', clientId)
      .order('called_at', { ascending: false })
      .range(offset, offset + limit - 1)
  );
}

// ── CLIENT: APPOINTMENTS ──────────────────────────────────────

export async function getMyAppointments(clientId) {
  return throwOnError(
    await supabase
      .from('appointments')
      .select('*')
      .eq('client_id', clientId)
      .gte('scheduled_at', new Date().toISOString().split('T')[0])
      .order('scheduled_at', { ascending: true })
  );
}

export async function getAppointmentStats(clientId) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [thisWeekRes, noShowRes, pendingRes] = await Promise.all([
    supabase
      .from('appointments')
      .select('id', { count: 'exact' })
      .eq('client_id', clientId)
      .gte('scheduled_at', weekAgo.toISOString()),
    supabase
      .from('appointments')
      .select('id', { count: 'exact' })
      .eq('client_id', clientId)
      .eq('status', 'no_show')
      .gte('scheduled_at', weekAgo.toISOString()),
    supabase
      .from('appointments')
      .select('id', { count: 'exact' })
      .eq('client_id', clientId)
      .eq('status', 'pending'),
  ]);

  return {
    thisWeek:  thisWeekRes.count || 0,
    noShows:   noShowRes.count  || 0,
    pending:   pendingRes.count || 0,
  };
}

// ── CLIENT: BILLING ───────────────────────────────────────────

// In a real setup, billing data comes from Stripe webhooks
// stored in a `invoices` table. For now, return from client record.
export async function getBillingInfo(clientId) {
  return throwOnError(
    await supabase
      .from('clients')
      .select('tier, mrr, since')
      .eq('id', clientId)
      .single()
  );
}

// ── CLIENT: SETTINGS ──────────────────────────────────────────

export async function updateSettings(clientId, profileId, { client, profile }) {
  const updates = [];

  if (client) {
    updates.push(
      supabase.from('clients').update(client).eq('id', clientId)
    );
  }
  if (profile) {
    updates.push(
      supabase.from('profiles').update(profile).eq('id', profileId)
    );
  }

  const results = await Promise.all(updates);
  const error = results.find(r => r.error);
  if (error) throw error.error;
  return true;
}

// ── REAL-TIME SUBSCRIPTIONS ───────────────────────────────────
// Use these in useEffect to get live updates without polling

// Listen for new recordings (client dashboard)
export function subscribeToRecordings(clientId, callback) {
  return supabase
    .channel(`recordings:${clientId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'recordings',
      filter: `client_id=eq.${clientId}`,
    }, payload => callback(payload.new))
    .subscribe();
}

// Listen for automation status changes (admin automations page)
export function subscribeToAutomations(callback) {
  return supabase
    .channel('automations')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'automations',
    }, payload => callback(payload.new))
    .subscribe();
}

// Unsubscribe helper
export function unsubscribe(channel) {
  supabase.removeChannel(channel);
}
