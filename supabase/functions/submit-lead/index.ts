// supabase/functions/submit-lead/index.ts
// Public endpoint (no auth required) for the marketing website's
// "Book a Free Trial" / inquiry form. Inserts a lead row.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { name, phone, email, source } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return new Response(JSON.stringify({ error: 'Name is required (minimum 2 characters)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!phone || typeof phone !== 'string' || phone.replace(/\D/g, '').length < 10) {
      return new Response(JSON.stringify({ error: 'A valid phone number is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use the service role key to bypass RLS (public leads insertion is allowed by policy,
    // but using service role for reliability)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for duplicate leads by phone in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', phone.trim())
      .gte('created_at', oneDayAgo)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Your inquiry has already been received. Our team will reach out shortly!',
        duplicate: true,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert the new lead
    const { data: lead, error } = await supabase.from('leads').insert({
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || null,
      source: source?.trim() || 'Landing Page',
      status: 'New Lead',
    }).select().single();

    if (error) {
      console.error('Lead insert error:', error);
      return new Response(JSON.stringify({ error: 'Failed to submit inquiry. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Thanks for your interest! Our team will call you within 2 hours to schedule a free trial session.',
      leadId: lead.id,
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('submit-lead error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
