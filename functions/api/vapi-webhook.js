// ============================================================
// functions/api/vapi-webhook.js
// Cloudflare Pages Function — receives all Vapi webhook events.
//
// Route: POST /api/vapi-webhook
//
// IDEMPOTENT: Safe to call multiple times for the same event.
// Vapi may retry on timeout or 5xx — every handler uses upsert.
// DB has UNIQUE constraints on:
//   recordings.vapi_call_id      (for upsert idempotency)
//   call_transcripts.recording_id (for upsert idempotency)
//
// Required env vars:
//   VAPI_WEBHOOK_SECRET       — verify x-vapi-secret header
//   VITE_SUPABASE_URL         — already set
//   SUPABASE_SERVICE_ROLE_KEY — server-side writes
//   N8N_WEBHOOK_URL           — post-call processor
//   N8N_WEBHOOK_SECRET        — n8n auth secret
// ============================================================

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-vapi-secret',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const incomingSecret = request.headers.get('x-vapi-secret');
  if (env.VAPI_WEBHOOK_SECRET && incomingSecret !== env.VAPI_WEBHOOK_SECRET) {
    console.warn('Webhook secret mismatch — rejected');
    return json({ error: 'Unauthorized' }, 401);
  }

  let event;
  try { event = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { message } = event;
  if (!message?.type) return json({ error: 'Missing message.type' }, 400);

  const supabaseUrl = env.VITE_SUPABASE_URL;
  const serviceKey  = env.SUPABASE_SERVICE_ROLE_KEY;
  const sbHeaders   = {
    'Content-Type':  'application/json',
    'apikey':        serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
  };

  console.log(`Vapi webhook: ${message.type} — call ${message.call?.id}`);

  try {
    switch (message.type) {
      case 'call-started':               await handleCallStarted(message, supabaseUrl, sbHeaders); break;
      case 'end-of-call-report':         await handleCallEnded(message, supabaseUrl, sbHeaders, env); break;
      case 'transcript':                 await handleTranscript(message, supabaseUrl, sbHeaders); break;
      case 'tool-calls':                 return await handleToolCalls(message, supabaseUrl, sbHeaders);
      case 'transfer-destination-request': await handleTransfer(message, supabaseUrl, sbHeaders); break;
      case 'speech-update':
      case 'status-update':              break; // informational only
      default: console.log(`Unhandled event type: ${message.type}`);
    }
  } catch (err) {
    console.error(`Handler error for ${message.type}:`, err);
    return json({ received: true, error: err.message });
  }

  return json({ received: true });
}

// ── call-started: upsert recording row ──────────────────────
async function handleCallStarted(message, supabaseUrl, sbHeaders) {
  const call = message.call;
  if (!call?.id) return;

  const isOutbound = call.type === 'outboundPhoneCall';
  const layer = isOutbound ? 'layer1' : 'layer2';

  const payload = {
    vapi_call_id:  call.id,
    client_id:     call.metadata?.client_id  || null,
    lead_id:       call.metadata?.lead_id    || null,
    phone_from:    call.customer?.number     || null,
    phone_to:      call.phoneNumber?.number  || null,
    call_type:     isOutbound ? 'outbound' : 'inbound',
    layer,
    call_status:   'in_progress',
    started_at:    call.startedAt            || new Date().toISOString(),
  };

  // Upsert — safe because UNIQUE constraint exists on recordings.vapi_call_id
  await fetch(`${supabaseUrl}/rest/v1/recordings`, {
    method:  'POST',
    headers: { ...sbHeaders, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
    body:    JSON.stringify(payload),
  });

  console.log(`Call started: ${call.id} (${layer})`);
}

// ── end-of-call-report: full call data ──────────────────────
async function handleCallEnded(message, supabaseUrl, sbHeaders, env) {
  const call     = message.call;
  const artifact = message.artifact;
  const analysis = message.analysis;
  if (!call?.id) return;

  const statusMap = {
    'customer-ended-call':     'completed',
    'assistant-ended-call':    'completed',
    'voicemail':               'voicemail',
    'no-answer':               'no_answer',
    'customer-did-not-answer': 'no_answer',
    'exceeded-max-duration':   'completed',
    'pipeline-error':          'failed',
  };
  const callStatus = statusMap[call.endedReason] || 'completed';
  const outcome    = analysis?.structuredData?.outcome || analysis?.summary || null;

  const payload = {
    call_status:    callStatus,
    duration_sec:   call.duration ? Math.round(call.duration) : null,
    recording_url:  artifact?.recordingUrl  || null,
    transcript:     artifact?.transcript    || null,
    ai_summary:     analysis?.summary       || null,
    outcome,
    cost_cents:     call.cost ? Math.round(call.cost * 100) : null,
    ended_at:       call.endedAt            || new Date().toISOString(),
    voicemail_left: call.endedReason === 'voicemail',
  };

  const updateRes = await fetch(
    `${supabaseUrl}/rest/v1/recordings?vapi_call_id=eq.${call.id}`,
    { method: 'PATCH', headers: sbHeaders, body: JSON.stringify(payload) }
  );
  if (!updateRes.ok) console.error('Failed to update recording:', await updateRes.text());

  // Update lead call_status only.
  // IMPORTANT: call_attempts is intentionally NOT set here.
  // n8n retry workflow reads the current value and increments it.
  if (call.metadata?.lead_id) {
    const leadStatusMap = {
      'completed': 'called',
      'voicemail': 'voicemail',
      'no_answer': 'no_answer',
      'failed':    'new',
    };
    await fetch(
      `${supabaseUrl}/rest/v1/leads?id=eq.${call.metadata.lead_id}`,
      {
        method:  'PATCH',
        headers: sbHeaders,
        body:    JSON.stringify({
          call_status:    leadStatusMap[callStatus] || 'called',
          vapi_called:    true,
          last_called_at: new Date().toISOString(),
        }),
      }
    );
  }

  // Trigger n8n post-call processor
  if (env.N8N_WEBHOOK_URL && artifact?.transcript) {
    fetch(`${env.N8N_WEBHOOK_URL.replace('/lead-trigger', '/post-call')}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'x-webhook-secret': env.N8N_WEBHOOK_SECRET || '' },
      body:    JSON.stringify({
        vapi_call_id:  call.id,
        lead_id:       call.metadata?.lead_id   || null,
        client_id:     call.metadata?.client_id || null,
        layer:         call.metadata?.layer     || 'layer2',
        call_status:   callStatus,
        outcome,
        transcript:    artifact.transcript,
        recording_url: artifact.recordingUrl    || null,
        duration_sec:  call.duration            || 0,
        cost_cents:    payload.cost_cents,
      }),
    }).catch(err => console.error('n8n post-call trigger error:', err));
  }

  console.log(`Call ended: ${call.id} — ${callStatus} — ${Math.round(call.duration || 0)}s`);
}

// ── transcript: save final transcript ───────────────────────
async function handleTranscript(message, supabaseUrl, sbHeaders) {
  const call = message.call;
  if (!call?.id || !message.transcript) return;
  if (message.transcriptType !== 'final') return;

  const recRes = await fetch(
    `${supabaseUrl}/rest/v1/recordings?vapi_call_id=eq.${call.id}&select=id`,
    { headers: sbHeaders }
  );
  if (!recRes.ok) return;
  const [recording] = await recRes.json();
  if (!recording?.id) return;

  // Upsert — safe because UNIQUE constraint exists on call_transcripts.recording_id
  await fetch(`${supabaseUrl}/rest/v1/call_transcripts`, {
    method:  'POST',
    headers: { ...sbHeaders, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
    body:    JSON.stringify({ recording_id: recording.id, transcript: message.transcript }),
  });
}

// ── tool-calls: synchronous mid-call tool responses ─────────
async function handleToolCalls(message, supabaseUrl, sbHeaders) {
  const toolCalls = message.toolCalls || [];
  const results   = [];

  for (const toolCall of toolCalls) {
    const { id, function: fn } = toolCall;
    const args = typeof fn.arguments === 'string' ? JSON.parse(fn.arguments) : fn.arguments;
    console.log(`Tool called: ${fn.name}`, args);

    let result;
    switch (fn.name) {
      case 'check_availability': {
        result = await checkAvailability(args.client_id, args.date, supabaseUrl, sbHeaders);
        break;
      }
      case 'book_appointment': {
        result = await bookAppointment(args, supabaseUrl, sbHeaders);
        break;
      }
      case 'qualify_lead': {
        const { lead_id, qualified, score, notes } = args;
        if (lead_id) {
          await fetch(`${supabaseUrl}/rest/v1/leads?id=eq.${lead_id}`, {
            method:  'PATCH', headers: sbHeaders,
            body:    JSON.stringify({ call_status: qualified ? 'qualified' : 'disqualified', qualified_score: score || null, notes: notes || null }),
          });
        }
        result = { success: true, status: qualified ? 'qualified' : 'disqualified' };
        break;
      }
      case 'book_demo': {
        result = await bookAppointment({ ...args, appointment_type: 'demo', client_id: null }, supabaseUrl, sbHeaders);
        if (result.success && args.lead_id) {
          await fetch(`${supabaseUrl}/rest/v1/leads?id=eq.${args.lead_id}`, {
            method:  'PATCH', headers: sbHeaders,
            body:    JSON.stringify({ stage: 'demo_booked', call_status: 'demo_booked', demo_booked_at: new Date().toISOString(), demo_date: args.scheduled_at || null }),
          });
        }
        break;
      }
      case 'transfer_to_human': {
        result = { success: true, message: 'Transferring you now. Please hold.' };
        break;
      }
      case 'lookup_client_info': {
        if (!args.client_id) { result = { error: 'client_id required' }; break; }
        const [client] = await (await fetch(`${supabaseUrl}/rest/v1/clients?id=eq.${args.client_id}&select=name,contact_name,city,tier,notes`, { headers: sbHeaders })).json();
        result = client || { error: 'Client not found' };
        break;
      }
      default: result = { error: `Unknown tool: ${fn.name}` };
    }

    results.push({ toolCallId: id, result: JSON.stringify(result) });
  }

  return new Response(JSON.stringify({ results }), { status: 200, headers: { 'Content-Type': 'application/json', ...CORS } });
}

// ── transfer-destination-request ────────────────────────────
async function handleTransfer(message, supabaseUrl, sbHeaders) {
  const call = message.call;
  if (!call?.id) return;
  await fetch(`${supabaseUrl}/rest/v1/recordings?vapi_call_id=eq.${call.id}`,
    { method: 'PATCH', headers: sbHeaders, body: JSON.stringify({ call_status: 'transferred' }) });
}

// ── TOOL HELPERS ─────────────────────────────────────────────

async function checkAvailability(clientId, date, supabaseUrl, sbHeaders) {
  if (!clientId || !date) return { error: 'client_id and date are required' };

  const requestedDate = new Date(date);
  const dayOfWeek     = requestedDate.getDay();

  const slots = await (await fetch(`${supabaseUrl}/rest/v1/availability?client_id=eq.${clientId}&day_of_week=eq.${dayOfWeek}&is_active=eq.true`, { headers: sbHeaders })).json();
  if (!slots.length) return { available: false, message: 'No availability on that day.' };

  const settingsArr = await (await fetch(`${supabaseUrl}/rest/v1/booking_settings?client_id=eq.${clientId}`, { headers: sbHeaders })).json();
  const settings    = settingsArr[0] || null;
  const duration    = settings?.appointment_duration || 30;
  const buffer      = settings?.buffer_time          || 15;

  const dateStr  = requestedDate.toISOString().split('T')[0];
  const nextDay  = new Date(requestedDate);
  nextDay.setDate(nextDay.getDate() + 1);
  const nextStr  = nextDay.toISOString().split('T')[0];

  const existingAppts = await (await fetch(
    `${supabaseUrl}/rest/v1/appointments?client_id=eq.${clientId}&scheduled_at=gte.${dateStr}T00:00:00Z&scheduled_at=lt.${nextStr}T00:00:00Z&status=neq.cancelled&select=scheduled_at,duration_minutes`,
    { headers: sbHeaders }
  )).json();

  const availableSlots = [];
  for (const slot of slots) {
    const [sh, sm] = slot.start_time.split(':').map(Number);
    const [eh, em] = slot.end_time.split(':').map(Number);
    let cur = new Date(requestedDate); cur.setHours(sh, sm, 0, 0);
    const end = new Date(requestedDate); end.setHours(eh, em, 0, 0);

    while (cur.getTime() + duration * 60000 <= end.getTime()) {
      const slotEnd = new Date(cur.getTime() + duration * 60000);
      const conflicts = existingAppts.some(a => {
        const as = new Date(a.scheduled_at);
        const ae = new Date(as.getTime() + (a.duration_minutes || 30) * 60000 + buffer * 60000);
        return cur < ae && slotEnd > as;
      });
      if (!conflicts) availableSlots.push({
        time:  cur.toISOString(),
        label: cur.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      });
      cur = new Date(cur.getTime() + (duration + buffer) * 60000);
    }
  }

  return { available: availableSlots.length > 0, date: dateStr, slots: availableSlots.slice(0, 6), duration };
}

async function bookAppointment(args, supabaseUrl, sbHeaders) {
  const { client_id, lead_id, patient_name, patient_phone, patient_email, appointment_type, scheduled_at, duration_minutes, notes } = args;
  if (!patient_name || !scheduled_at) return { error: 'patient_name and scheduled_at are required' };

  const icalUid = `apt-${Date.now()}-${Math.random().toString(36).slice(2)}@aiautomatedcalls.com`;

  const apptPayload = {
    client_id:         client_id || null,
    lead_id:           lead_id   || null,
    patient_name,
    phone:             patient_phone   || null,  // DB col is 'phone', arg is 'patient_phone'
    patient_email:     patient_email   || null,
    appointment_type:  appointment_type || 'appointment',
    scheduled_at,
    duration_minutes:  duration_minutes || 30,
    status:            'confirmed',
    calendar_source:   'native',
    ical_uid:          icalUid,
    confirmation_sent: false,
    reminder_sent:     false,
    notes:             notes || null,
  };

  const insertRes = await fetch(`${supabaseUrl}/rest/v1/appointments`, {
    method:  'POST',
    headers: { ...sbHeaders, 'Prefer': 'return=representation' },
    body:    JSON.stringify(apptPayload),
  });

  if (!insertRes.ok) {
    console.error('Appointment insert error:', await insertRes.text());
    return { error: 'Failed to book appointment. Please try again.' };
  }

  const [appt]       = await insertRes.json();
  const apptDate     = new Date(scheduled_at);
  const formatted    = apptDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const formattedTime = apptDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return {
    success:              true,
    appointment_id:       appt.id,
    ical_uid:             icalUid,
    scheduled_at,
    confirmation_message: `Perfect! You're booked for ${formatted} at ${formattedTime}. You'll receive a confirmation shortly.`,
  };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
