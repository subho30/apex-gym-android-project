// supabase/functions/verify-gate-token/index.ts
// Called by the staff scanner app when a QR code is scanned at the turnstile.
// Validates the HMAC signature, checks expiry, verifies membership status,
// records the check-in, and increments live occupancy.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GATE_SECRET = Deno.env.get('GATE_TOKEN_SECRET') || 'apex-gym-gate-secret-v1-change-me';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function hmacVerify(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const sigBytes = new Uint8Array(
    signature.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
  );
  return crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(payload));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Staff must be authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the caller is staff or manager
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || !['staff', 'manager'].includes(userRole.role)) {
      return new Response(JSON.stringify({ error: 'Only staff or managers can verify gate passes' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse the scanned QR payload
    const body = await req.json();
    const { qrPayload, gate = 'Main Turnstile A' } = body;

    if (!qrPayload) {
      return new Response(JSON.stringify({ error: 'Missing qrPayload in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Decode the QR payload
    let parsed: { payload: string; signature: string };
    try {
      parsed = JSON.parse(qrPayload);
    } catch {
      return new Response(JSON.stringify({
        verified: false,
        reason: 'Invalid QR code format. This is not an Apex Gym gate pass.',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { payload, signature } = parsed;

    // Step 1: Verify HMAC signature
    const isValidSig = await hmacVerify(payload, signature, GATE_SECRET);
    if (!isValidSig) {
      return new Response(JSON.stringify({
        verified: false,
        reason: 'QR code signature verification failed. Possible tampered or counterfeit pass.',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Parse and check expiry
    const tokenData = JSON.parse(payload);
    const now = Math.floor(Date.now() / 1000);

    if (tokenData.exp < now) {
      return new Response(JSON.stringify({
        verified: false,
        reason: `QR code expired ${now - tokenData.exp} seconds ago. Ask the member to show their live QR pass from the app.`,
        memberName: tokenData.name,
        memberId: tokenData.memberId,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 3: Look up member and verify active status
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, member_id, name, tier, status, streak_days')
      .eq('member_id', tokenData.memberId)
      .single();

    if (memberError || !member) {
      return new Response(JSON.stringify({
        verified: false,
        reason: `Member ID ${tokenData.memberId} not found in the system.`,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (member.status !== 'Active') {
      return new Response(JSON.stringify({
        verified: false,
        reason: `Entry denied. ${member.name}'s membership status is "${member.status}". Direct to front desk for renewal.`,
        memberName: member.name,
        memberId: member.member_id,
        memberTier: member.tier,
        memberStatus: member.status,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 4: Mark the gate token as used (prevent replay)
    if (tokenData.tokenId) {
      const { data: existingToken } = await supabase
        .from('gate_tokens')
        .select('id, used')
        .eq('token', tokenData.tokenId)
        .single();

      if (existingToken?.used) {
        return new Response(JSON.stringify({
          verified: false,
          reason: 'This QR code has already been used. Ask the member to show a fresh QR pass.',
          memberName: member.name,
          memberId: member.member_id,
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (existingToken) {
        await supabase
          .from('gate_tokens')
          .update({ used: true, used_at: new Date().toISOString() })
          .eq('id', existingToken.id);
      }
    }

    // Step 5: Record the check-in
    await supabase.from('check_ins').insert({
      member_id: member.id,
      member_name: member.name,
      tier: member.tier,
      gate,
      method: 'Dynamic QR Token',
    });

    // Step 6: Increment live occupancy
    await supabase.rpc('increment_occupancy');

    // Step 7: Update member's check-in state and streak
    await supabase
      .from('members')
      .update({
        is_checked_in: true,
        streak_days: member.streak_days + 1,
      })
      .eq('id', member.id);

    return new Response(JSON.stringify({
      verified: true,
      memberName: member.name,
      memberId: member.member_id,
      memberTier: member.tier,
      message: `Welcome, ${member.name}! Gate unlocked.`,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('verify-gate-token error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
