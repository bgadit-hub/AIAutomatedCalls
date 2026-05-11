// ============================================================
// functions/api/book-appointment.js
// Cloudflare Pages Function
//
// Route: POST /api/book-appointment
// Body (JSON):
//   client_id        (required) — UUID of the client
//   patient_name     (required)
//   phone            (required) — caller phone
//   scheduled_at     (required) — ISO datetime (from check-availability slot)
//   appointment_type (optional, default 'appointment')
//   patient_email    (optional)
//   duration_minutes (optional, default from booking_settings)
//   notes            (optional)
//   lead_id          (optional) — links back to leads table
//
// Returns { success, appointment_id, ical_uid, confirmation_message }
//
// Required env vars:
//   VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
// ============================================================

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function cleanPhone(raw) {
  const digits = (raw || '').replace(/\D/g, '');
  const norm   = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  return norm.length === 10 ? norm : null;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON body.' }, 400); }

  const {
    client_id,
    patient_name,
    phone,
    patient_email,
    appointment_type,
    scheduled_at,
    duration_minutes,
    notes,
    lead_id,
  } = body;

  // Validate required fields
  if (!client_id)    return json({ error: 'client_id is required.' }, 400);
  if (!patient_name) return json({ error: 'patient_name is required.' }, 400);
  if (!phone)        return json({ error: 'phone is required.' }, 400);
  if (!scheduled_at) return json({ error: 'scheduled_at is required.' }, 400);

  const cleanedPhone = cleanPhone(phone);
  if (!cleanedPhone) return json({ error: 'Please enter a valid 10-digit US phone number.' }, 400);

  // Validate scheduled_at is a valid date and not in the past
  const slotDate = new Date(scheduled_at);
  if (isNaN(slotDate.getTime())) return json({ error: 'scheduled_at is not a valid date.' }, 400);
  if (slotDate.getTime() < Date.now() - 60000) return json({ error: 'Cannot book appointments in the past.' }, 400);

  const supabaseUrl = env.VITE_SUPABASE_URL;
  const serviceKey  = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return json({ error: 'Server configuration error.' }, 500);

  const sbHeaders = {
    'Content-Type':  'application/json',
    'apikey':        serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
  };

  try {
    // 1. Verify the slot is still available (prevent double-booking)
    const date    = scheduled_at.split('T')[0];
    const nextDay = new Date(slotDate); nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const nextStr = nextDay.toISOString().split('T')[0];

    const dur = duration_minutes || await getDefaultDuration(client_id, supabaseUrl, sbHeaders);
    const slotEnd = new Date(slotDate.getTime() + dur * 60000);

    const conflictRes = await fetch(
      `${supabaseUrl}/rest/v1/appointments?client_id=eq.${client_id}&scheduled_at=gte.${date}T00:00:00Z&scheduled_at=lt.${nextStr}T00:00:00Z&status=neq.cancelled&select=scheduled_at,duration_minutes`,
      { headers: sbHeaders }
    );
    const existing = conflictRes.ok ? await conflictRes.json() : [];

    const conflict = existing.some(appt => {
      const as = new Date(appt.scheduled_at);
      const ae = new Date(as.getTime() + (appt.duration_minutes || dur) * 60000);
      return slotDate < ae && slotEnd > as;
    });

    if (conflict) {
      return json({ error: 'That time slot is no longer available. Please choose another.' }, 409);
    }

    // 2. Insert appointment
    const icalUid = `apt-${Date.now()}-${Math.random().toString(36).slice(2)}@aiautomatedcalls.com`;

    const payload = {
      client_id,
      lead_id:           lead_id           || null,
      patient_name:      patient_name.trim(),
      phone:             cleanedPhone,            // DB col is 'phone'
      patient_email:     patient_email?.trim()   || null,
      appointment_type:  appointment_type         || 'appointment',
      scheduled_at,
      duration_minutes:  dur,
      status:            'confirmed',
      calendar_source:   'native',
      ical_uid:          icalUid,
      confirmation_sent: false,
      reminder_sent:     false,
      notes:             notes?.trim()           || null,
    };

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/appointments`, {
      method:  'POST',
      headers: { ...sbHeaders, 'Prefer': 'return=representation' },
      body:    JSON.stringify(payload),
    });

    if (!insertRes.ok) {
      const err = await insertRes.text();
      console.error('Appointment insert error:', err);
      return json({ error: 'Failed to create appointment. Please try again.' }, 500);
    }

    const [appt] = await insertRes.json();

    // 3. Format confirmation message
    const formatted     = slotDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
    const formattedTime = slotDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' });

    console.log(`Appointment booked: ${appt.id} — ${patient_name} — ${scheduled_at}`);

    return json({
      success:              true,
      appointment_id:       appt.id,
      ical_uid:             icalUid,
      scheduled_at,
      confirmation_message: `You're confirmed for ${formatted} at ${formattedTime}. We'll send a reminder before your appointment.`,
    });

  } catch (err) {
    console.error('book-appointment error:', err);
    return json({ error: 'Unexpected error. Please try again.' }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

// ── Helper: get default appointment duration from booking_settings ──
async function getDefaultDuration(clientId, supabaseUrl, sbHeaders) {
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/booking_settings?client_id=eq.${clientId}&select=appointment_duration`,
      { headers: sbHeaders }
    );
    const [s] = res.ok ? await res.json() : [null];
    return s?.appointment_duration ?? 30;
  } catch { return 30; }
}
