// ============================================================
// functions/api/submit-lead.js
// Cloudflare Pages Function — receives marketing form submission,
// inserts lead into Supabase, triggers n8n → Vapi outbound call.
//
// Route: POST /api/submit-lead
//
// Required env vars (Cloudflare Pages → Settings → Environment Variables):
//   SUPABASE_SERVICE_ROLE_KEY  — Supabase service role key (bypasses RLS)
//   VITE_SUPABASE_URL          — already set
//   N8N_WEBHOOK_URL            — n8n lead trigger webhook URL
//   N8N_WEBHOOK_SECRET         — shared secret for n8n auth
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

// Clean and validate phone number — strip all non-digits, must be 10-11 digits
function cleanPhone(raw) {
  const digits = raw.replace(/\D/g, '');
  // Handle leading 1 (US country code)
  const normalized = digits.length === 11 && digits.startsWith('1')
    ? digits.slice(1)
    : digits;
  return normalized.length === 10 ? normalized : null;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // ── 1. Parse body ────────────────────────────────────────────
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { name, phone, email, business_type, pain_point } = body;

  // ── 2. Validate required fields ──────────────────────────────
  if (!name || !phone) {
    return json({ error: 'Name and phone number are required.' }, 400);
  }

  const cleanedPhone = cleanPhone(phone);
  if (!cleanedPhone) {
    return json({ error: 'Please enter a valid 10-digit US phone number.' }, 400);
  }

  // ── 3. Check for duplicate lead (same phone, last 24h) ───────
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const serviceKey  = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase env vars');
    return json({ error: 'Server configuration error.' }, 500);
  }

  const supabaseHeaders = {
    'Content-Type':  'application/json',
    'apikey':        serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
  };

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const dupeCheck = await fetch(
    `${supabaseUrl}/rest/v1/leads?phone=eq.${cleanedPhone}&created_at=gte.${since}&limit=1`,
    { headers: supabaseHeaders }
  );

  if (dupeCheck.ok) {
    const dupes = await dupeCheck.json();
    if (dupes.length > 0) {
      // Already submitted recently — return success silently (don’t double-call them)
      console.log(`Duplicate lead suppressed for phone: ${cleanedPhone}`);
      return json({
        success: true,
        message: "We already have your info — our team will be in touch shortly!",
      });
    }
  }

  // ── 4. Insert into Supabase leads table ──────────────────────
  // Column names match ACTUAL schema (see SCHEMA.md):
  // business_name, contact_name, phone, email, niche, stage, call_status
  const leadPayload = {
    business_name: business_type || 'Not specified',
    contact_name:  name.trim(),
    phone:         cleanedPhone,
    email:         email?.trim() || null,
    niche:         business_type || null,
    pain_point:    pain_point?.trim() || null,
    source:        'website',
    stage:         'cold',         // pipeline stage — actual col is 'stage' not 'status'
    call_status:   'new',          // Vapi call tracking status
    call_attempts: 0,
    vapi_called:   false,
    score:         50,
    tier:          'Standard',
    value:         2000,
  };

  const insertRes = await fetch(`${supabaseUrl}/rest/v1/leads`, {
    method:  'POST',
    headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
    body:    JSON.stringify(leadPayload),
  });

  if (!insertRes.ok) {
    const errText = await insertRes.text();
    console.error('Supabase insert error:', errText);
    return json({ error: 'Failed to save your info. Please try again.' }, 500);
  }

  const [lead] = await insertRes.json();
  console.log(`Lead created: ${lead.id} — ${lead.contact_name} — ${lead.phone}`);

  // ── 5. Update lead status to 'calling' ───────────────────────
  // Do this before triggering n8n so the pipeline shows correct state
  await fetch(`${supabaseUrl}/rest/v1/leads?id=eq.${lead.id}`, {
    method:  'PATCH',
    headers: supabaseHeaders,
    body:    JSON.stringify({ call_status: 'calling' }),
  });

  // ── 6. Trigger n8n webhook (fire and forget) ─────────────────
  // n8n waits 45 seconds then triggers Vapi outbound call.
  // We don’t await this — user gets instant 200 response.
  if (env.N8N_WEBHOOK_URL) {
    fetch(env.N8N_WEBHOOK_URL, {
      method:  'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-webhook-secret': env.N8N_WEBHOOK_SECRET || '',
      },
      body: JSON.stringify({
        lead_id:       lead.id,
        name:          lead.contact_name,
        phone:         lead.phone,
        business_type: lead.niche,
        pain_point:    lead.pain_point,
        email:         lead.email,
      }),
    }).catch(err => console.error('n8n trigger error:', err));
  } else {
    console.warn('N8N_WEBHOOK_URL not set — call not triggered');
  }

  // ── 7. Return success ─────────────────────────────────────────
  return json({
    success: true,
    message: "Perfect! Expect a call within the next 60 seconds.",
    lead_id: lead.id,
  });
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS,
  });
}
