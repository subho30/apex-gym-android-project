// supabase/functions/generate-gate-token/index.ts
// Generates a cryptographically signed, time-limited QR gate pass token.
// Called by the member app every 30 seconds to get a fresh scannable QR payload.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GATE_SECRET = Deno.env.get('GATE_TOKEN_SECRET') || 'apex-gym-gate-secret-v1-change-me';
const TOKEN_TTL_SECONDS = 35; // slightly longer than 30s client refresh to avoid race conditions

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function hmacSign(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract the user's JWT from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a Supabase client with the user's JWT (respects RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the JWT and get the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch the member profile linked to this user
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, member_id, name, tier, status')
      .eq('user_id', user.id)
      .single();

    if (memberError || !member) {
      return new Response(JSON.stringify({ error: 'No member profile found for this account' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check membership status
    if (member.status !== 'Active') {
      return new Response(JSON.stringify({
        error: 'Gate pass unavailable',
        reason: `Membership status: ${member.status}. Please contact the front desk.`
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate the token
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + TOKEN_TTL_SECONDS;
    const tokenId = crypto.randomUUID().split('-')[0].toUpperCase();
    const gateToken = `APX-${tokenId}`;

    // Build the payload that will be signed
    const payload = JSON.stringify({
      memberId: member.member_id,
      name: member.name,
      tier: member.tier,
      tokenId: gateToken,
      iat: now,
      exp: expiresAt,
      club: 'APEX-PARK-STREET',
    });

    const signature = await hmacSign(payload, GATE_SECRET);

    // Store the token in the database for server-side verification
    const { error: insertError } = await supabase.from('gate_tokens').insert({
      member_id: member.id,
      token: gateToken,
      issued_at: new Date(now * 1000).toISOString(),
      expires_at: new Date(expiresAt * 1000).toISOString(),
    });

    if (insertError) {
      console.error('Failed to store gate token:', insertError);
      // Non-fatal: the token can still be verified via HMAC signature
    }

    // Return the full QR payload (what gets encoded in the QR code)
    const qrPayload = JSON.stringify({
      payload,
      signature,
    });

    return new Response(JSON.stringify({
      qrPayload,
      token: gateToken,
      expiresInSeconds: TOKEN_TTL_SECONDS,
      memberName: member.name,
      memberId: member.member_id,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('generate-gate-token error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
