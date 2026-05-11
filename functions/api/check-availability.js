// ============================================================
// functions/api/check-availability.js
// Cloudflare Pages Function
//
// Route: GET /api/check-availability
// Query params:
//   client_id  (required) — UUID of the client
//   date       (required) — YYYY-MM-DD
//
// Returns available appointment slots for a given client + date.
// Used by the public /book page and the Vapi tool handler.
//
// Required env vars:
//   VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
// ============================================================

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url    = new URL(request.url);
  const clientId = url.searchParams.get('client_id');
  const date     = url.searchParams.get('date');

  if (!clientId || !date) {
    return json({ error: 'client_id and date are required query params.' }, 400);
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ error: 'date must be in YYYY-MM-DD format.' }, 400);
  }

  const supabaseUrl = env.VITE_SUPABASE_URL;
  const serviceKey  = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'Server configuration error.' }, 500);
  }

  const sbHeaders = {
    'Content-Type':  'application/json',
    'apikey':        serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
  };

  try {
    const result = await checkAvailability(clientId, date, supabaseUrl, sbHeaders);
    return json(result);
  } catch (err) {
    console.error('check-availability error:', err);
    return json({ error: 'Failed to fetch availability.' }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

// ============================================================
// CORE LOGIC
// ============================================================

async function checkAvailability(clientId, date, supabaseUrl, sbHeaders) {
  const requestedDate = new Date(`${date}T12:00:00Z`); // noon UTC avoids DST edge cases
  const dayOfWeek     = requestedDate.getUTCDay();      // 0=Sun, 6=Sat

  // 1. Get client's availability windows for this day of week
  const availRes = await fetch(
    `${supabaseUrl}/rest/v1/availability?client_id=eq.${clientId}&day_of_week=eq.${dayOfWeek}&is_active=eq.true&select=start_time,end_time`,
    { headers: sbHeaders }
  );
  if (!availRes.ok) throw new Error('Failed to fetch availability');
  const windows = await availRes.json();

  if (!windows.length) {
    return { available: false, date, slots: [], message: 'No availability configured for this day.' };
  }

  // 2. Get booking settings (duration, buffer, timezone)
  const settingsRes = await fetch(
    `${supabaseUrl}/rest/v1/booking_settings?client_id=eq.${clientId}&select=appointment_duration,buffer_time,min_notice_hours,timezone,appointment_types`,
    { headers: sbHeaders }
  );
  const [settings]  = settingsRes.ok ? await settingsRes.json() : [null];
  const duration    = settings?.appointment_duration ?? 30;  // minutes
  const buffer      = settings?.buffer_time          ?? 15;  // minutes between slots
  const minNotice   = settings?.min_notice_hours     ?? 2;   // hours advance notice
  const apptTypes   = settings?.appointment_types    || ['General', 'Consultation', 'Follow-up'];

  // 3. Get existing confirmed/pending appointments for this date
  const nextDate = new Date(`${date}T12:00:00Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  const nextStr = nextDate.toISOString().split('T')[0];

  const apptRes = await fetch(
    `${supabaseUrl}/rest/v1/appointments?client_id=eq.${clientId}&scheduled_at=gte.${date}T00:00:00Z&scheduled_at=lt.${nextStr}T00:00:00Z&status=neq.cancelled&select=scheduled_at,duration_minutes`,
    { headers: sbHeaders }
  );
  const existing = apptRes.ok ? await apptRes.json() : [];

  // 4. Build slot list
  const now         = Date.now();
  const minNoticeMs = minNotice * 60 * 60 * 1000;
  const slots       = [];

  for (const window of windows) {
    const [sh, sm] = window.start_time.split(':').map(Number);
    const [eh, em] = window.end_time.split(':').map(Number);

    // Build slot start times in UTC using date + parsed hours
    let cur = new Date(`${date}T${pad(sh)}:${pad(sm)}:00Z`);
    const end = new Date(`${date}T${pad(eh)}:${pad(em)}:00Z`);

    while (cur.getTime() + duration * 60000 <= end.getTime()) {
      const slotEnd = new Date(cur.getTime() + duration * 60000);

      // Skip slots that are too soon
      if (cur.getTime() - now < minNoticeMs) {
        cur = new Date(cur.getTime() + (duration + buffer) * 60000);
        continue;
      }

      // Check conflicts with existing appointments
      const conflicts = existing.some(appt => {
        const as = new Date(appt.scheduled_at);
        const ae = new Date(as.getTime() + (appt.duration_minutes || duration) * 60000 + buffer * 60000);
        return cur < ae && slotEnd > as;
      });

      if (!conflicts) {
        slots.push({
          datetime: cur.toISOString(),
          label:    formatTime(cur),
          duration,
        });
      }

      cur = new Date(cur.getTime() + (duration + buffer) * 60000);
    }
  }

  return {
    available:        slots.length > 0,
    date,
    slots,
    duration,
    appointment_types: apptTypes,
    message:          slots.length > 0 ? `${slots.length} slots available` : 'No slots available for this date.',
  };
}

function pad(n) { return String(n).padStart(2, '0'); }
function formatTime(d) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' });
}
