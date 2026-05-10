import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!;
    const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'admin@umcimbi.co.za';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      vendorsResult, organisersResult, eventsResult, requestsResult,
      quotesResult, bookingsResult, platformEventsResult, previousBriefResult,
    ] = await Promise.all([
      supabase.from('vendors').select('id, name, owner_user_id, created_at, logo_url, about, price_range_text, bank_name, signup_source'),
      supabase.from('user_roles').select('user_id, role').then(async (res: any) => {
        if (res.error || !res.data) return res;
        // Exclude any user who also has the vendor role — organisers are user-only accounts
        const vendorIds = new Set(res.data.filter((r: any) => r.role === 'vendor').map((r: any) => r.user_id));
        const organiserIds = Array.from(new Set(
          res.data.filter((r: any) => r.role === 'user' && !vendorIds.has(r.user_id)).map((r: any) => r.user_id)
        ));
        if (organiserIds.length === 0) return { data: [], error: null };
        const { data } = await supabase.from('profiles').select('user_id, created_at').in('user_id', organiserIds);
        return { data: data ?? [], error: null };
      }),
      supabase.from('events').select('id, owner_user_id, type, created_at'),
      supabase.from('service_requests').select('id, status, created_at, vendor_id, requester_user_id, responded_at'),
      supabase.from('quotes').select('id, status, created_at'),
      supabase.from('bookings').select('id, agreed_price, booking_status, deposit_status, balance_status, funds_held_since, event_date_time, created_at, updated_at'),
      supabase.from('platform_events').select('event_type, metadata, created_at').gte('created_at', yesterday.toISOString()),
      supabase.from('daily_briefs').select('raw_stats').order('generated_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    const vendors = vendorsResult.data ?? [];
    const organisers = organisersResult.data ?? [];
    const events = eventsResult.data ?? [];
    const requests = requestsResult.data ?? [];
    const quotes = quotesResult.data ?? [];
    const bookings = bookingsResult.data ?? [];
    const platformEvents = platformEventsResult.data ?? [];
    const previousBrief = previousBriefResult.data?.raw_stats ?? null;

    const vendorsTotal = vendors.length;
    const vendorsNew24h = vendors.filter((v: any) => v.created_at >= yesterday.toISOString()).length;
    const vendorsNew7d = vendors.filter((v: any) => v.created_at >= weekAgo.toISOString()).length;
    const vendorsViaNdabe = vendors.filter((v: any) => v.signup_source === 'ndabe').length;
    const vendorsWithPhoto = vendors.filter((v: any) => !!v.logo_url).length;
    const vendorsWithDescription = vendors.filter((v: any) => (v.about?.length ?? 0) > 50).length;
    const vendorsWithPricing = vendors.filter((v: any) => !!v.price_range_text?.trim()).length;
    const vendorsWithBank = vendors.filter((v: any) => !!v.bank_name?.trim()).length;
    const vendorsCompleteProfile = vendors.filter((v: any) =>
      !!v.logo_url && (v.about?.length ?? 0) > 50 && !!v.price_range_text?.trim() && !!v.bank_name?.trim()
    ).length;
    const vendorsMissingBank = vendors
      .filter((v: any) => !v.bank_name?.trim())
      .map((v: any) => ({ name: v.name, days_since_registration: Math.floor((now.getTime() - new Date(v.created_at).getTime()) / (24 * 60 * 60 * 1000)) }))
      .sort((a, b) => b.days_since_registration - a.days_since_registration)
      .slice(0, 5);

    const organisersTotal = organisers.length;
    const organisersNew24h = organisers.filter((o: any) => o.created_at >= yesterday.toISOString()).length;
    const organisersNew7d = organisers.filter((o: any) => o.created_at >= weekAgo.toISOString()).length;
    const organisersWithEvent = new Set(events.map((e: any) => e.owner_user_id)).size;
    const activationRate = organisersTotal > 0 ? Math.round((organisersWithEvent / organisersTotal) * 100) : 0;

    const requestsLast24h = requests.filter((r: any) => r.created_at >= yesterday.toISOString()).length;
    const quotesLast24h = quotes.filter((q: any) => q.created_at >= yesterday.toISOString()).length;
    const respondedRequests = requests.filter((r: any) => !!r.responded_at);
    const avgResponseHours = respondedRequests.length > 0
      ? Math.round(respondedRequests.reduce((sum: number, r: any) => sum + (new Date(r.responded_at!).getTime() - new Date(r.created_at).getTime()) / (60 * 60 * 1000), 0) / respondedRequests.length)
      : null;

    const bookingsTotal = bookings.length;
    const bookingsActive = bookings.filter((b: any) => ['pending_deposit', 'confirmed'].includes(b.booking_status)).length;
    const bookingsCompleted = bookings.filter((b: any) => b.booking_status === 'completed').length;
    const bookingsDisputed = bookings.filter((b: any) => b.booking_status === 'disputed').length;
    const escrowHeld = bookings.filter((b: any) => b.booking_status === 'confirmed' && b.funds_held_since).length;
    const escrowAlerts = bookings.filter((b: any) =>
      b.booking_status === 'confirmed' && b.funds_held_since && b.event_date_time &&
      new Date(b.event_date_time).getTime() <= now.getTime() + 5 * 24 * 60 * 60 * 1000
    ).length;
    const completedToday = bookings.filter((b: any) =>
      b.booking_status === 'completed' && b.updated_at >= yesterday.toISOString()
    );
    const platformRevenueToday = completedToday.reduce(
      (sum: number, b: any) => sum + (Number(b.agreed_price) / 1.08 * 0.08), 0
    );

    const searches24h = platformEvents.filter((e: any) => e.event_type === 'search_performed').length;
    const zeroResults24h = platformEvents.filter((e: any) => e.event_type === 'search_zero_results');
    const topZeroResultQuery = zeroResults24h.length > 0
      ? ((zeroResults24h[0] as any).metadata?.query
        || (zeroResults24h[0] as any).metadata?.location
        || (zeroResults24h[0] as any).metadata?.category
        || 'unknown')
      : null;

    const rawStats = {
      generated_at: now.toISOString(),
      vendors: { total: vendorsTotal, new_24h: vendorsNew24h, new_7d: vendorsNew7d, via_ndabe: vendorsViaNdabe, with_photo: vendorsWithPhoto, with_description: vendorsWithDescription, with_pricing: vendorsWithPricing, with_bank_details: vendorsWithBank, complete_profile: vendorsCompleteProfile, missing_bank_top5: vendorsMissingBank },
      organisers: { total: organisersTotal, new_24h: organisersNew24h, new_7d: organisersNew7d, with_event_created: organisersWithEvent, activation_rate_pct: activationRate },
      activity: { requests_last_24h: requestsLast24h, quotes_last_24h: quotesLast24h, avg_vendor_response_hours: avgResponseHours, searches_24h: searches24h, zero_results_24h: zeroResults24h.length, top_zero_result: topZeroResultQuery },
      bookings: { total: bookingsTotal, active: bookingsActive, completed: bookingsCompleted, disputed: bookingsDisputed, escrow_held: escrowHeld, escrow_alerts_5d: escrowAlerts, platform_revenue_today_rands: Math.round(platformRevenueToday) },
    };

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicApiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 700,
        system: `You are the operations intelligence layer for UMCIMBI, a South African digital marketplace for traditional Zulu ceremonies (Lobola, Umembeso, Umbondo, Umabo, Umemulo, Imbeleko, Ancestral Ritual). Every morning at 07:00 SAST you write a short operations brief for Andile, the solo founder.

Andile reads this on his phone before his day starts. He cannot check the dashboard daily. The brief is his single window into platform health.

WRITING RULES:
- Plain English. Warm but direct. No jargon. No marketing fluff.
- Open with "Sawubona Andile."
- Use these section headers in this order: Vendors. Organisers. Activity. Money. Watch out. Today's one thing. Win.
- Each section: 1-3 short sentences. Skip a section only if there is genuinely nothing to say.
- "Today's one thing" is the single most valuable action Andile could take in 5-10 minutes today. It must be specific (with names, numbers, or links where you have them). Never generic advice like "engage with vendors" — say which vendor, why, and what to do.
- "Win" = the best thing that happened. Even tiny wins count, especially early on.
- "Watch out" = anything genuinely concerning. Skip it if there is nothing.
- If the platform is brand new with thin data, be honest about that and still find something useful to say.
- Never inflate. Never hedge with "consider" or "maybe". Be direct.
- No markdown formatting. No asterisks. Just paragraphs.`,
        messages: [{
          role: 'user',
          content: `Today is ${now.toLocaleDateString('en-ZA', { timeZone: 'Africa/Johannesburg', weekday: 'long', day: 'numeric', month: 'long' })} SAST.

Platform stats:
${JSON.stringify(rawStats, null, 2)}

${previousBrief ? `Yesterday's stats for comparison:\n${JSON.stringify(previousBrief, null, 2)}` : 'No prior brief — this is the first or close to first one.'}

Write Andile's morning brief.`,
        }],
      }),
    });

    let briefText = 'Brief unavailable — check ANTHROPIC_API_KEY in Edge Function secrets.';
    try {
      const anthropicData = await anthropicRes.json();
      briefText = anthropicData?.content?.[0]?.text ?? briefText;
    } catch (e) {
      console.error('Anthropic response parse error:', e);
    }

    const { data: briefRow, error: insertErr } = await supabase
      .from('daily_briefs')
      .insert({ brief_text: briefText, raw_stats: rawStats })
      .select('id')
      .single();

    if (insertErr) console.error('Failed to store brief:', insertErr);

    let emailQueued = false;
    try {
      const messageId = crypto.randomUUID();
      const dateStr = now.toLocaleDateString('en-ZA', { timeZone: 'Africa/Johannesburg', day: 'numeric', month: 'long' });

      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: 'admin_daily_brief',
        recipient_email: adminEmail,
        status: 'pending',
      });

      const escapedBrief = briefText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f5f3ef;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#222;">
  <div style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
    <div style="background:#4B0082;color:#ffffff;padding:24px;">
      <h2 style="margin:0;font-size:20px;">UMCIMBI AI Daily Brief</h2>
      <p style="margin:4px 0 0;font-size:13px;opacity:0.85;">${dateStr}</p>
    </div>
    <div style="padding:24px;font-size:15px;line-height:1.6;white-space:pre-line;">${escapedBrief}</div>
    <div style="padding:0 24px 24px;">
      <a href="https://www.umcimbi.co.za/admin" style="display:inline-block;background:#4B0082;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;">View dashboard</a>
    </div>
    <div style="padding:16px 24px;background:#fafafa;color:#888;font-size:12px;">
      Generated at ${now.toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })} SAST
    </div>
  </div>
</body></html>`;

      const text = `UMCIMBI AI Daily Brief — ${dateStr}\n\n${briefText}\n\nView dashboard: https://www.umcimbi.co.za/admin`;

      let unsubscribeToken: string | null = null;
      const { data: existingToken } = await supabase
        .from('email_unsubscribe_tokens')
        .select('token')
        .eq('email', adminEmail)
        .maybeSingle();

      unsubscribeToken = existingToken?.token ?? null;

      if (!unsubscribeToken) {
        const { data: newToken, error: tokenError } = await supabase
          .from('email_unsubscribe_tokens')
          .insert({ email: adminEmail, token: crypto.randomUUID() })
          .select('token')
          .single();

        if (tokenError) throw tokenError;
        unsubscribeToken = newToken.token;
      }

      const { error: enqueueError } = await supabase.rpc('enqueue_email', {
        queue_name: 'transactional_emails',
        payload: {
          message_id: messageId,
          to: adminEmail,
          from: 'UMCIMBI <noreply@umcimbi.co.za>',
          sender_domain: 'mail.umcimbi.co.za',
          subject: `UMCIMBI Daily Brief — ${dateStr}`,
          html,
          text,
          purpose: 'transactional',
          idempotency_key: `admin-daily-brief-${now.toISOString().slice(0, 10)}-${messageId}`,
          unsubscribe_token: unsubscribeToken,
          label: 'admin_daily_brief',
          queued_at: now.toISOString(),
        },
      });

      if (enqueueError) {
        console.error('Failed to enqueue daily brief email:', enqueueError);
        await supabase.from('email_send_log')
          .update({ status: 'failed', error_message: 'Failed to enqueue: ' + enqueueError.message })
          .eq('message_id', messageId);
      } else {
        emailQueued = true;
      }
    } catch (emailErr) {
      console.error('Daily brief email enqueue threw:', emailErr);
    }

    if (briefRow?.id) {
      await supabase.from('daily_briefs').update({ email_sent: emailQueued }).eq('id', briefRow.id);
    }

    return new Response(JSON.stringify({
      success: true, brief: briefText, email_queued: emailQueued,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('admin-daily-brief error:', err);
    return new Response(JSON.stringify({ error: 'Internal error generating brief' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
