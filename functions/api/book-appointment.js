// ============================================================
// functions/api/book-appointment.js
// Cloudflare Pages Function
//
// Route: POST /api/book-appointment
// Body (JSON):
//   client_id        (required) — UUID of the client
//   patient_name     (required)
//   phone            (required)
//   scheduled_at     (required) — ISO datetime
//   appointment_type (optional, default 'appointment')
//   patient_email    (optional) — receives confirmation email
//   duration_minutes (optional, default from booking_settings)
//   notes            (optional)
//   lead_id          (optional)
//
// Returns { success, appointment_id, ical_uid, confirmation_message }
//
// Required env vars:
//   VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
// Optional:
//   RESEND_API_KEY   — sends confirmation email if patient_email provided
//   RESEND_FROM      — from address (default: appointments@aiautomatedcalls.com)
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

// ── HTML email template ──────────────────────────────────────
function buildConfirmationEmail({ patientName, businessName, businessPhone, formattedDate, formattedTime, appointmentType }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:#1FA8A0;padding:28px 32px;">
      <div style="font-size:13px;color:rgba(255,255,255,0.75);font-weight:500;margin-bottom:6px;letter-spacing:.04em;text-transform:uppercase;">Appointment Confirmed</div>
      <h1 style="margin:0;font-size:24px;font-weight:800;color:#FFFFFF;letter-spacing:-.02em;">${businessName}</h1>
    </div>
    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="margin:0 0 20px;font-size:15px;color:#374151;">Hi <strong>${patientName}</strong>,</p>
      <p style="margin:0 0 24px;font-size:14px;color:#6B7280;line-height:1.6;">Your appointment is confirmed. We look forward to seeing you.</p>
      <!-- Details card -->
      <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:0;overflow:hidden;margin-bottom:24px;">
        ${[
          ['📅 Date', formattedDate],
          ['🕐 Time', formattedTime],
          ['📋 Type', appointmentType],
        ].map(([label, value], i, arr) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;${i < arr.length - 1 ? 'border-bottom:1px solid #E5E7EB;' : ''}">
          <span style="font-size:13px;color:#6B7280;font-weight:500;">${label}</span>
          <span style="font-size:13px;color:#111827;font-weight:600;">${value}</span>
        </div>`).join('')}
      </div>
      ${businessPhone ? `<p style="margin:0 0 8px;font-size:13px;color:#6B7280;">Need to reschedule? Call us: <a href="tel:${businessPhone}" style="color:#1FA8A0;font-weight:600;text-decoration:none;">${businessPhone}</a></p>` : ''}
      <p style="margin:0;font-size:13px;color:#9CA3AF;">You'll receive a reminder before your appointment.</p>
    </div>
    <!-- Footer -->
    <div style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:14px 32px;">
      <p style="margin:0;font-size:11px;color:#9CA3AF;">Powered by <a href="https://aiautomatedcalls.com" style="color:#1FA8A0;text-decoration:none;">AI Automated Calls</a> &mdash; AI receptionist for local businesses.</p>
    </div>
  </div>
</body>
</html>`;
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

  if (!client_id)    return json({ error: 'client_id is required.' }, 400);
  if (!patient_name) return json({ error: 'patient_name is required.' }, 400);
  if (!phone)        return json({ error: 'phone is required.' }, 400);
  if (!scheduled_at) return json({ error: 'scheduled_at is required.' }, 400);

  const cleanedPhone = cleanPhone(phone);
  if (!cleanedPhone) return json({ error: 'Please enter a valid 10-digit US phone number.' }, 400);

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
    // 1. Get default duration + client info (name, phone for email)
    const [settingsData, clientData] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/booking_settings?client_id=eq.${client_id}&select=appointment_duration`, { headers: sbHeaders }).then(r => r.ok ? r.json() : []),
      fetch(`${supabaseUrl}/rest/v1/clients?id=eq.${client_id}&select=name,phone_number`, { headers: sbHeaders }).then(r => r.ok ? r.json() : []),
    ]);
    const dur          = duration_minutes || settingsData[0]?.appointment_duration || 30;
    const businessName = clientData[0]?.name        || 'Your Provider';
    const businessPhone= clientData[0]?.phone_number || null;

    // 2. Double-booking check
    const date    = scheduled_at.split('T')[0];
    const nextDay = new Date(slotDate); nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const nextStr = nextDay.toISOString().split('T')[0];
    const slotEnd = new Date(slotDate.getTime() + dur * 60000);

    const conflictRes = await fetch(
      `${supabaseUrl}/rest/v1/appointments?client_id=eq.${client_id}&scheduled_at=gte.${date}T00:00:00Z&scheduled_at=lt.${nextStr}T00:00:00Z&status=neq.cancelled&select=scheduled_at,duration_minutes`,
      { headers: sbHeaders }
    );
    const existing = conflictRes.ok ? await conflictRes.json() : [];
    const conflict  = existing.some(appt => {
      const as = new Date(appt.scheduled_at);
      const ae = new Date(as.getTime() + (appt.duration_minutes || dur) * 60000);
      return slotDate < ae && slotEnd > as;
    });
    if (conflict) return json({ error: 'That time slot is no longer available. Please choose another.' }, 409);

    // 3. Insert appointment
    const icalUid = `apt-${Date.now()}-${Math.random().toString(36).slice(2)}@aiautomatedcalls.com`;
    const payload = {
      client_id,
      lead_id:           lead_id            || null,
      patient_name:      patient_name.trim(),
      phone:             cleanedPhone,
      patient_email:     patient_email?.trim() || null,
      appointment_type:  appointment_type      || 'appointment',
      scheduled_at,
      duration_minutes:  dur,
      status:            'confirmed',
      calendar_source:   'native',
      ical_uid:          icalUid,
      confirmation_sent: false,
      reminder_sent:     false,
      notes:             notes?.trim()         || null,
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

    // 4. Format display times
    const formatted     = slotDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
    const formattedTime = slotDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' });

    // 5. Send confirmation email via Resend (fire-and-forget, fail silently)
    let emailSent = false;
    if (patient_email?.trim() && env.RESEND_API_KEY) {
      try {
        const fromAddr = env.RESEND_FROM || 'appointments@aiautomatedcalls.com';
        const emailHtml = buildConfirmationEmail({
          patientName:     patient_name.trim(),
          businessName,
          businessPhone,
          formattedDate:   formatted,
          formattedTime,
          appointmentType: appointment_type || 'Appointment',
        });

        const resendRes = await fetch('https://api.resend.com/emails', {
          method:  'POST',
          headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({
            from:    `${businessName} <${fromAddr}>`,
            to:      [patient_email.trim()],
            subject: `Your appointment is confirmed — ${formatted} at ${formattedTime}`,
            html:    emailHtml,
          }),
        });

        if (resendRes.ok) {
          emailSent = true;
          // Update confirmation_sent flag (best-effort)
          fetch(`${supabaseUrl}/rest/v1/appointments?id=eq.${appt.id}`, {
            method:  'PATCH',
            headers: { ...sbHeaders },
            body:    JSON.stringify({ confirmation_sent: true }),
          }).catch(() => {});
        } else {
          const resendErr = await resendRes.text();
          console.error('Resend error:', resendErr);
        }
      } catch (emailErr) {
        console.error('Email send error (non-fatal):', emailErr);
      }
    }

    console.log(`Appointment booked: ${appt.id} — ${patient_name} — ${scheduled_at} — email sent: ${emailSent}`);

    return json({
      success:              true,
      appointment_id:       appt.id,
      ical_uid:             icalUid,
      scheduled_at,
      email_sent:           emailSent,
      confirmation_message: `You're confirmed for ${formatted} at ${formattedTime}.${
        emailSent ? ` A confirmation email has been sent to ${patient_email}.` : ''
      } We'll send a reminder before your appointment.`,
    });

  } catch (err) {
    console.error('book-appointment error:', err);
    return json({ error: 'Unexpected error. Please try again.' }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
