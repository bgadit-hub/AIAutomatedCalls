// src/useSupabase.js
// Data-fetching hooks for the dashboard.
// Each hook falls back to null while loading so components can show mock data.
import { useState, useEffect } from 'react';
import { supabase } from './supabase';

// ─── helpers ─────────────────────────────────────────
export function fmtDuration(secs) {
  if (!secs) return '0s';
  const m = Math.floor(secs / 60), s = Math.round(secs % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
export function fmtRelative(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}
export function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });
}
export function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const today = new Date(); today.setHours(0,0,0,0);
  const tom = new Date(today); tom.setDate(tom.getDate()+1);
  if (d >= today && d < tom) return `Today ${d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true})}`;
  if (d >= tom && d < new Date(tom.getTime()+86400000)) return `Tomorrow ${d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true})}`;
  return d.toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',hour12:true});
}

// ─── ADMIN HOOKS ────────────────────────────────────────

// All active clients, sorted by MRR desc
export function useClients() {
  const [data, setData] = useState(null);
  useEffect(() => {
    supabase.from('clients')
      .select('id, name, contact_name, tier, mrr, calls_month, status, agent_status, since, city, created_at')
      .order('mrr', { ascending: false })
      .then(({ data: rows }) => {
        if (!rows) { setData([]); return; }
        setData(rows.map(c => ({
          id:      c.id,
          name:    c.name || 'Unknown',
          contact: c.contact_name || '',
          tier:    c.tier || 'Starter',
          mrr:     c.mrr || 0,
          calls:   c.calls_month || 0,
          status:  c.status || 'active',
          since:   c.since || new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          agent:   c.agent_status || 'healthy',
          city:    c.city || '',
        })));
      });
  }, []);
  return data;
}

// Active leads for the pipeline (excludes won/disqualified)
export function useLeads() {
  const [data, setData] = useState(null);
  useEffect(() => {
    supabase.from('leads')
      .select('id, business_name, contact_name, city, score, tier, stage, call_status, last_called_at, updated_at')
      .not('stage', 'in', '("won","disqualified","lost")')
      .order('score', { ascending: false })
      .limit(60)
      .then(({ data: rows }) => {
        if (!rows) { setData([]); return; }
        setData(rows.map(l => ({
          id:    l.id,
          biz:   l.business_name || 'Unknown',
          name:  l.contact_name  || '',
          city:  l.city          || '',
          score: l.score         || 0,
          tier:  l.tier          || 'Standard',
          stage: l.stage         || 'cold',
          last:  fmtRelative(l.updated_at || l.last_called_at),
        })));
      });
  }, []);
  return data;
}

// Overview stats for the admin dashboard header cards
export function useAdminStats() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    Promise.all([
      supabase.from('clients').select('id, mrr').eq('status', 'active'),
      supabase.from('leads').select('id').not('stage', 'in', '("won","disqualified","lost")'),
      supabase.from('recordings').select('id').gte('started_at', todayStart.toISOString()),
    ]).then(([clients, leads, calls]) => {
      setStats({
        activeClients: clients.data?.length || 0,
        totalMrr:      clients.data?.reduce((s, c) => s + (c.mrr || 0), 0) || 0,
        pipelineLeads: leads.data?.length || 0,
        callsToday:    calls.data?.length || 0,
      });
    });
  }, []);
  return stats;
}

// Analytics hook — real call, booking, and pipeline data for AdminAnalytics page
export function useAnalyticsData() {
  const [data, setData] = useState(null);
  useEffect(() => {
    const since14 = new Date(); since14.setDate(since14.getDate() - 14);
    const since30 = new Date(); since30.setDate(since30.getDate() - 30);
    Promise.all([
      supabase.from('recordings')
        .select('started_at, outcome, call_status, duration_sec')
        .gte('started_at', since14.toISOString()),
      supabase.from('leads')
        .select('stage, tier, created_at'),
      supabase.from('clients')
        .select('mrr, tier, status')
        .eq('status', 'active'),
      supabase.from('appointments')
        .select('status, scheduled_at')
        .gte('scheduled_at', since30.toISOString()),
    ]).then(([recs, leads, clients, appts]) => {
      const recordings = recs.data || [];
      const leadsData  = leads.data || [];
      const clientsData = clients.data || [];
      const apptsData  = appts.data || [];

      // ── Daily call volume (last 14 days, labelled D1–D14) ──────────
      const dayMap = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const label = `D${d.getDate()}`;
        dayMap[key] = { d: label, calls: 0, booked: 0 };
      }
      recordings.forEach(r => {
        const key = r.started_at?.slice(0, 10);
        if (key && dayMap[key]) {
          dayMap[key].calls++;
          const isBooked = r.outcome === 'booked' || r.call_status === 'booked';
          if (isBooked) dayMap[key].booked++;
        }
      });
      const callTrend = Object.values(dayMap);

      // ── Summary stats ───────────────────────────────────────────────
      const totalCalls = recordings.length;
      const booked14d  = recordings.filter(r => r.outcome === 'booked' || r.call_status === 'booked').length;
      const bookingRate = totalCalls > 0 ? Math.round(booked14d / totalCalls * 100) : 0;
      const totalDur   = recordings.reduce((s, r) => s + (r.duration_sec || 0), 0);
      const avgDurSec  = totalCalls > 0 ? Math.round(totalDur / totalCalls) : 0;

      // ── Lead pipeline breakdown ─────────────────────────────────────
      const stageOrder = ['cold', 'demo', 'ai_called', 'hot', 'proposal'];
      const stages = {};
      leadsData.forEach(l => { stages[l.stage] = (stages[l.stage] || 0) + 1; });
      const pipelineData = stageOrder
        .filter(s => stages[s] > 0)
        .map(s => ({ name: s.replace('_', ' '), value: stages[s] }));

      // ── MRR breakdown ───────────────────────────────────────────────
      const mrrByTier = { Starter: 0, Standard: 0, Premium: 0 };
      clientsData.forEach(c => { mrrByTier[c.tier] = (mrrByTier[c.tier] || 0) + (c.mrr || 0); });
      const totalMrr = Object.values(mrrByTier).reduce((s, v) => s + v, 0);

      // ── Appointment stats ───────────────────────────────────────────
      const confirmed30d = apptsData.filter(a => a.status === 'confirmed').length;
      const noShows30d   = apptsData.filter(a => a.status === 'no_show').length;

      setData({
        callTrend,
        totalCalls14d: totalCalls,
        booked14d,
        bookingRate,
        avgDurSec,
        pipelineData,
        mrrByTier,
        totalMrr,
        appts30d:     apptsData.length,
        confirmed30d,
        noShows30d,
      });
    });
  }, []);
  return data;
}

// ─── CLIENT HOOKS ────────────────────────────────────────

// Resolves the logged-in user's client record
export function useClientContext() {
  const [ctx, setCtx] = useState({ clientId: null, clientName: null, loading: true });
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { setCtx({ clientId: null, clientName: null, loading: false }); return; }
      supabase.from('clients')
        .select('id, name, tier, mrr, calls_month')
        .eq('profile_id', session.user.id)
        .single()
        .then(({ data: c }) => {
          setCtx({ clientId: c?.id || null, clientName: c?.name || null, clientData: c, loading: false });
        });
    });
  }, []);
  return ctx;
}

// Recent call recordings for a client
export function useRecordings(clientId) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!clientId) { setData([]); return; }
    supabase.from('recordings')
      .select('id, phone_from, phone_to, duration_sec, call_type, outcome, call_status, started_at, recording_url, ai_summary, transcript')
      .eq('client_id', clientId)
      .not('call_status', 'in', '("in_progress")')
      .order('started_at', { ascending: false })
      .limit(25)
      .then(({ data: rows }) => {
        if (!rows) { setData([]); return; }
        setData(rows.map(r => ({
          id:     r.id,
          from:   r.phone_from ? `+1 (${r.phone_from.slice(0,3)}) ${r.phone_from.slice(3,6)}-${r.phone_from.slice(6)}` : r.phone_from || 'Unknown',
          dur:    fmtDuration(r.duration_sec),
          time:   fmtDateTime(r.started_at),
          outcome: r.outcome || r.call_status || 'completed',
          type:   r.call_type === 'outbound' ? 'outbound' : 'inbound',
          tx:     r.transcript || r.ai_summary || '(Transcript not available)',
          url:    r.recording_url || null,
        })));
      });
  }, [clientId]);
  return data;
}

// Upcoming & recent appointments for a client
export function useAppointments(clientId) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!clientId) { setData([]); return; }
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    supabase.from('appointments')
      .select('id, patient_name, phone, appointment_type, scheduled_at, status, notes')
      .eq('client_id', clientId)
      .neq('status', 'cancelled')
      .gte('scheduled_at', cutoff.toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(25)
      .then(({ data: rows }) => {
        if (!rows) { setData([]); return; }
        setData(rows.map(a => ({
          id:     a.id,
          name:   a.patient_name || 'Unknown',
          date:   fmtDate(a.scheduled_at),
          type:   a.appointment_type || 'Appointment',
          status: a.status || 'confirmed',
          phone:  a.phone || '',
        })));
      });
  }, [clientId]);
  return data;
}
