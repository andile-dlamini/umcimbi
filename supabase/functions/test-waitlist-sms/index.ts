import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const res = await fetch(`${url}/functions/v1/send-waitlist-launch-emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ signupId: '7d448a05-0cf2-4359-be65-6f90fb6548fc' }),
  });

  const body = await res.text();
  return new Response(JSON.stringify({ status: res.status, body }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
