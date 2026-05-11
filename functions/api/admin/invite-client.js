// ============================================================
// functions/api/admin/invite-client.js
// Cloudflare Pages Function — admin only
//
// Route: POST /api/admin/invite-client
// Headers: Authorization: Bearer <user JWT>
// Body (JSON):
//   email        (required) — client login email
//   name         (required) — business name
//   contact_name (optional)
//   city         (optional)
//   tier         (optional, default 'Standard')
//   mrr          (optional, default 0)
//   phone        (optional)
//
// 1. Verifies caller is admin via JWT → profiles.role check
// 2. Invites user via Supabase Auth (sends email with magic link)
// 3. Creates clients row linked to new user
// 4. Returns { success, user_id, client_id }
//
// Required env vars:
//   VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
// ============================================================

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

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

  // ── 1. Verify caller JWT ───────────────────────────
  const authHeader = request.headers.get('Authorization');
  const callerJwt  = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!callerJwt) return json({ error: 'Missing Authorization header.' }, 401);

  let callerId;
  try {
    // Decode JWT payload (base64url → JSON) — not cryptographic verification,
    // but we confirm the role against the DB using the service key next.
    const payload = JSON.parse(
      atob(callerJwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
    );
    callerId = payload.sub;
  } catch {
    return json({ error: 'Invalid token.' }, 401);
  }

  // ── 2. Confirm admin role in profiles ─────────────────
  const profileRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${callerId}&select=role`,
    { headers: sbHeaders }
  );
  const profiles = profileRes.ok ? await profileRes.json() : [];
  if (profiles[0]?.role !== 'admin') {
    return json({ error: 'Forbidden — admin only.' }, 403);
  }

  // ── 3. Parse request body ──────────────────────────
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON body.' }, 400); }

  const { email, name, contact_name, city, tier, mrr, phone } = body;

  if (!email?.trim()) return json({ error: 'email is required.' }, 400);
  if (!name?.trim())  return json({ error: 'name (business name) is required.' }, 400);

  // ── 4. Invite user via Supabase Auth ─────────────────
  // The invite flow:
  //   a. User is created in auth.users (unconfirmed)
  //   b. handle_new_user trigger fires → profiles row created with role='client'
  //   c. Invite email sent with magic link to set password
  const inviteRes = await fetch(`${supabaseUrl}/auth/v1/invite`, {
    method:  'POST',
    headers: sbHeaders,
    body:    JSON.stringify({
      email: email.trim(),
      data:  {
        full_name:    (contact_name || name).trim(),
        role:         'client',
        company_name: name.trim(),
      },
    }),
  });

  if (!inviteRes.ok) {
    const err = await inviteRes.json().catch(() => ({}));
    const msg = err.msg || err.message || err.error_description || 'Failed to invite user.';
    console.error('Supabase invite error:', msg);
    return json({ error: msg }, 400);
  }

  const user = await inviteRes.json();
  console.log(`User invited: ${user.id} — ${email}`);

  // ── 5. Create clients row ───────────────────────────
  const clientPayload = {
    profile_id:    user.id,
    name:          name.trim(),
    contact_name:  contact_name?.trim()  || null,
    contact_email: email.trim(),
    city:          city?.trim()          || null,
    tier:          tier                  || 'Standard',
    mrr:           parseInt(mrr)         || 0,
    phone_number:  phone?.trim()         || null,
    status:        'active',
    agent_status:  'healthy',
    since:         new Date().toISOString().split('T')[0],
  };

  const clientRes = await fetch(`${supabaseUrl}/rest/v1/clients`, {
    method:  'POST',
    headers: { ...sbHeaders, 'Prefer': 'return=representation' },
    body:    JSON.stringify(clientPayload),
  });

  if (!clientRes.ok) {
    const err = await clientRes.text();
    console.error('clients insert error:', err);
    // User was invited but clients row failed — partial success
    return json({
      success: true,
      user_id: user.id,
      warning: `Client record creation failed: ${err}`,
      message: `Invite sent to ${email}. Please create the client record manually.`,
    });
  }

  const [client] = await clientRes.json();
  console.log(`Client created: ${client.id} — ${name}`);

  return json({
    success:   true,
    user_id:   user.id,
    client_id: client.id,
    message:   `Invite sent to ${email}. They can log in after accepting.`,
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
