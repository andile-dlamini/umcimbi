import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FEEDBACK_EMAIL = Deno.env.get('FEEDBACK_EMAIL') || 'feedback@umcimbi.co.za';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claimsData.claims.sub as string;
    const userEmail = (claimsData.claims.email as string) || null;

    const body = await req.json().catch(() => ({}));
    const feedbackType = String(body.feedback_type || '').trim();
    const message = String(body.message || '').trim();
    const pageUrl = body.page_url ? String(body.page_url).slice(0, 500) : null;
    const userAgent = body.user_agent ? String(body.user_agent).slice(0, 500) : null;

    if (!['bug', 'idea', 'praise', 'other'].includes(feedbackType)) {
      return new Response(JSON.stringify({ error: 'Invalid feedback_type' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (message.length < 10 || message.length > 2000) {
      return new Response(JSON.stringify({ error: 'Message must be 10-2000 characters' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Determine user role
    const { data: roles } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    const roleSet = new Set((roles || []).map((r: any) => r.role));
    const userRole = roleSet.has('admin') ? 'admin' : roleSet.has('vendor') ? 'vendor' : 'planner';

    // Insert feedback row
    const { data: row, error: insertErr } = await admin
      .from('feedback')
      .insert({
        user_id: userId,
        user_email: userEmail,
        user_role: userRole,
        feedback_type: feedbackType,
        message,
        page_url: pageUrl,
        user_agent: userAgent,
      })
      .select('id, created_at')
      .single();

    if (insertErr || !row) {
      console.error('feedback insert error:', insertErr);
      return new Response(JSON.stringify({ error: 'Failed to record feedback' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Enqueue email
    const messageId = crypto.randomUUID();
    const now = new Date();
    const dateStr = now.toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' });

    await admin.from('email_send_log').insert({
      message_id: messageId,
      template_name: 'feedback_alert',
      recipient_email: FEEDBACK_EMAIL,
      status: 'pending',
    });

    // Unsubscribe token for the recipient
    let unsubscribeToken: string | null = null;
    const { data: existingToken } = await admin
      .from('email_unsubscribe_tokens')
      .select('token')
      .eq('email', FEEDBACK_EMAIL)
      .maybeSingle();
    unsubscribeToken = existingToken?.token ?? null;
    if (!unsubscribeToken) {
      const { data: newTok, error: tokErr } = await admin
        .from('email_unsubscribe_tokens')
        .insert({ email: FEEDBACK_EMAIL, token: crypto.randomUUID() })
        .select('token')
        .single();
      if (tokErr) {
        console.error('token insert err:', tokErr);
      } else {
        unsubscribeToken = newTok.token;
      }
    }

    const escape = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const typeLabel = { bug: 'Bug', idea: 'Idea', praise: 'Praise', other: 'Other' }[feedbackType];

    const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f5f3ef;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#222;">
  <div style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
    <div style="background:#4B0082;color:#ffffff;padding:24px;">
      <h2 style="margin:0;font-size:20px;">New UMCIMBI Feedback</h2>
      <p style="margin:4px 0 0;font-size:13px;opacity:0.85;">${escape(typeLabel)} · ${escape(dateStr)} SAST</p>
    </div>
    <div style="padding:24px;font-size:14px;line-height:1.6;">
      <p style="margin:0 0 6px;color:#888;">From</p>
      <p style="margin:0 0 16px;"><strong>${escape(userEmail || 'Unknown')}</strong> &middot; ${escape(userRole)}</p>
      <p style="margin:0 0 6px;color:#888;">Message</p>
      <div style="white-space:pre-line;background:#fafafa;padding:14px 16px;border-radius:8px;border:1px solid #eee;">${escape(message)}</div>
      ${pageUrl ? `<p style="margin:16px 0 0;color:#888;font-size:12px;">Page: ${escape(pageUrl)}</p>` : ''}
    </div>
    <div style="padding:0 24px 24px;">
      <a href="https://www.umcimbi.co.za/admin/feedback" style="display:inline-block;background:#4B0082;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;">View in Admin</a>
    </div>
  </div>
</body></html>`;

    const text = `New UMCIMBI Feedback (${typeLabel})\n\nFrom: ${userEmail || 'Unknown'} (${userRole})\n\n${message}\n\n${pageUrl ? `Page: ${pageUrl}\n\n` : ''}View: https://www.umcimbi.co.za/admin/feedback`;

    const { error: enqErr } = await admin.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: {
        message_id: messageId,
        to: FEEDBACK_EMAIL,
        from: 'UMCIMBI <noreply@umcimbi.co.za>',
        sender_domain: 'mail.umcimbi.co.za',
        subject: `[Feedback · ${typeLabel}] ${message.slice(0, 60)}${message.length > 60 ? '…' : ''}`,
        html,
        text,
        purpose: 'transactional',
        idempotency_key: `feedback-${row.id}`,
        unsubscribe_token: unsubscribeToken,
        label: 'feedback_alert',
        queued_at: now.toISOString(),
      },
    });

    if (enqErr) {
      console.error('enqueue feedback email failed:', enqErr);
      await admin.from('email_send_log')
        .update({ status: 'failed', error_message: 'Enqueue failed: ' + enqErr.message })
        .eq('message_id', messageId);
    }

    return new Response(JSON.stringify({ success: true, id: row.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-feedback error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
