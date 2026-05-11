// ============================================================
// functions/api/generate-ad.js
// Cloudflare Pages Function — proxies the Anthropic API call
// so the API key is never exposed to the browser.
//
// Auto-routed by Cloudflare Pages to: POST /api/generate-ad
// Set ANTHROPIC_API_KEY in: Pages → Settings → Environment Variables
// ============================================================

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS preflight
  const corsHeaders = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const { platform, niche, city, goal, tone } = body;

  if (!platform || !niche || !city) {
    return new Response(JSON.stringify({ error: 'Missing required fields: platform, niche, city' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Build the Claude prompt
  const prompt = `You are an expert ad copywriter for AI Automated Calls (aiautomatedcalls.com), an agency that deploys AI voice receptionists for local businesses.

Create a complete ${platform} ad for:
- Target: ${niche} in ${city}
- Goal: ${goal || 'Book a demo call'}
- Tone: ${tone || 'Professional'}

Return ONLY valid JSON (no markdown, no backticks, no extra text):
{
  "headline": "Punchy headline under 40 characters",
  "primary_text": "2-3 sentences. Lead with the pain point, end with the solution.",
  "cta": "Call to action button text, 4 words max",
  "hook": "Single line that stops the scroll — make it feel personal to ${niche}",
  "hashtags": ["tag1", "tag2", "tag3"],
  "targeting_tip": "One specific sentence on best audience targeting settings for this ad"
}`;

  // Call Anthropic API
  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':        'application/json',
        'x-api-key':           env.ANTHROPIC_API_KEY,
        'anthropic-version':   '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 600,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      console.error('Anthropic error:', err);
      return new Response(JSON.stringify({ error: 'Anthropic API error', detail: err }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const anthropicData = await anthropicRes.json();
    const rawText = anthropicData.content?.[0]?.text || '';

    // Parse the JSON response from Claude
    let adCopy;
    try {
      adCopy = JSON.parse(rawText.replace(/```json|```/g, '').trim());
    } catch {
      // Claude returned something non-JSON — return a safe fallback
      adCopy = {
        headline:       `AI Receptionist for ${niche}`,
        primary_text:   `Stop losing calls to voicemail. Our AI answers every call 24/7, books appointments automatically, and follows up with every lead. Setup in 48 hours.`,
        cta:            'Book a Demo',
        hook:           `Your after-hours calls are going to voicemail right now.`,
        hashtags:       ['AIReceptionist', 'LocalBusiness', 'NeverMissACall'],
        targeting_tip:  `Target decision-makers aged 35–60 in ${city} interested in business automation.`,
      };
    }

    return new Response(JSON.stringify(adCopy), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('Function error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
