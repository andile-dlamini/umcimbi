// Connect Mobile SMS balance monitor
// Fetches current SMS credit balance, classifies traffic-light status,
// persists the result, and (optionally) logs a low-balance alert.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const BALANCE_URL = 'https://api.connect-mobile.co.za/sms/balance/v3/'
const ADMIN_ALERT_EMAIL = 'admin@umcimbi.co.za'

// Thresholds (approved by user)
const GREEN_MIN = 200 // > 200 -> green
const RED_MAX = 50   // < 50 -> red ; 50..200 -> yellow

type Status = 'green' | 'yellow' | 'red' | 'error'

function classify(balance: number): Status {
  if (balance > GREEN_MIN) return 'green'
  if (balance < RED_MAX) return 'red'
  return 'yellow'
}

// Try to extract balance from a few common JSON shapes.
function extractBalance(body: unknown): number | null {
  if (body == null) return null
  if (typeof body === 'number') return body
  if (typeof body === 'string') {
    const n = Number(body)
    return Number.isFinite(n) ? n : null
  }
  if (typeof body !== 'object') return null
  const obj = body as Record<string, unknown>
  const candidates: unknown[] = [
    obj.balance,
    obj.credits,
    obj.sms_balance,
    obj.smsBalance,
    obj.remaining,
    (obj.data as Record<string, unknown> | undefined)?.balance,
    (obj.data as Record<string, unknown> | undefined)?.credits,
    (obj.result as Record<string, unknown> | undefined)?.balance,
  ]
  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c)) return c
    if (typeof c === 'string') {
      const n = Number(c)
      if (Number.isFinite(n)) return n
    }
  }
  return null
}

async function fetchBalance(apiKey: string): Promise<{
  balance: number | null
  raw: unknown
  authMode: string
  httpStatus: number
}> {
  // Try Bearer first
  let res = await fetch(BALANCE_URL, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
    },
  })
  let authMode = 'bearer'
  let raw: unknown = null
  const text = await res.text()
  try { raw = JSON.parse(text) } catch { raw = text }

  if (res.status === 401 || res.status === 403) {
    // Fallback: query string
    const url = `${BALANCE_URL}?api_key=${encodeURIComponent(apiKey)}`
    res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } })
    authMode = 'query'
    const text2 = await res.text()
    try { raw = JSON.parse(text2) } catch { raw = text2 }
  }

  console.log('Connect Mobile balance response', {
    httpStatus: res.status,
    authMode,
    rawPreview: typeof raw === 'string' ? raw.slice(0, 500) : raw,
  })

  return {
    balance: extractBalance(raw),
    raw,
    authMode,
    httpStatus: res.status,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const apiKey = Deno.env.get('CONNECT_MOBILE_API_KEY')

  // Auth: allow either service-role (cron) or an admin user (UI refresh)
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  const isServiceRole = token && token === serviceKey

  if (!isServiceRole) {
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token)
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const userId = claims.claims.sub as string
    const { data: isAdmin } = await userClient.rpc('has_role', {
      _user_id: userId,
      _role: 'admin',
    })
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'CONNECT_MOBILE_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(supabaseUrl, serviceKey)

  let balance: number | null = null
  let raw: unknown = null
  let httpStatus = 0
  let authMode = 'bearer'
  try {
    const r = await fetchBalance(apiKey)
    balance = r.balance
    raw = r.raw
    httpStatus = r.httpStatus
    authMode = r.authMode
  } catch (e) {
    console.error('Balance fetch threw', e)
    raw = { error: String(e) }
  }

  const status: Status =
    balance == null ? 'error' : classify(balance)

  // Persist
  const { data: inserted, error: insertErr } = await admin
    .from('sms_balance_checks')
    .insert({
      balance: balance ?? -1,
      status,
      raw_response: { http_status: httpStatus, auth_mode: authMode, body: raw },
    })
    .select()
    .single()

  if (insertErr) console.error('Failed to persist balance check', insertErr)

  // Low-balance alert: log to email_send_log so admins can see it.
  // (Transactional email sending pipeline is not fully scaffolded; once it is,
  //  this block can be swapped to invoke `send-transactional-email`.)
  if (status === 'red' && inserted) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentAlerts } = await admin
      .from('sms_balance_checks')
      .select('id')
      .eq('status', 'red')
      .eq('alert_sent', true)
      .gte('checked_at', since)
      .limit(1)

    if (!recentAlerts || recentAlerts.length === 0) {
      const { error: logErr } = await admin.from('email_send_log').insert({
        message_id: `sms-balance-low-${inserted.id}`,
        template_name: 'sms-balance-low',
        recipient_email: ADMIN_ALERT_EMAIL,
        status: 'pending',
        metadata: {
          balance,
          threshold_red: RED_MAX,
          subject: `[UMCIMBI] SMS balance low: ${balance} credits remaining`,
          message: `Connect Mobile SMS balance is ${balance} (threshold < ${RED_MAX}). Please recharge.`,
        },
      })
      if (logErr) {
        console.error('Failed to log low-balance alert', logErr)
      } else {
        await admin
          .from('sms_balance_checks')
          .update({ alert_sent: true })
          .eq('id', inserted.id)
        console.warn(`SMS BALANCE LOW: ${balance} credits — alert logged for ${ADMIN_ALERT_EMAIL}`)
      }
    }
  }

  return new Response(
    JSON.stringify({
      balance,
      status,
      checked_at: inserted?.checked_at ?? new Date().toISOString(),
      http_status: httpStatus,
      auth_mode: authMode,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
