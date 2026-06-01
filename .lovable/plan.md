## Plan: Harden admin-daily-brief auth to service-role key check

### What we're changing
Replace the permissive auth block in `supabase/functions/admin-daily-brief/index.ts` (lines 14–24) with a strict Bearer-token check against the `SUPABASE_SERVICE_ROLE_KEY` environment variable. This prevents unauthenticated or loosely-authenticated callers from accessing the admin daily-brief endpoint.

### Exact diff
**Remove lines 14–24:**
```
  // Auth: accept any bearer token. This function is invoked only by pg_cron
  // (internal) and admins, and contains no destructive operations — it
  // aggregates data and emails the admin. Keeping a hard service-role check
  // here was failing because the vault-stored key has drifted from env.
  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
```

**Insert in its place:**
```
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const authHeader = req.headers.get('authorization') ?? '';
  if (!serviceKey || authHeader !== `Bearer ${serviceKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
```

### No other changes
- No modification to Anthropic prompt, data queries, email logic, or any other function code
- No changes to `corsHeaders`
- No frontend or other file changes

### Deployment
After the edit, deploy only: `supabase functions deploy admin-daily-brief`