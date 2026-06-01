# Surgical Auth Fix for `trigger-vendor-payout`

## What this plan covers
Replace the weak string-length Bearer check (lines 98-101) in `supabase/functions/trigger-vendor-payout/index.ts` with a real two-path authentication gate.

## Current problem
The existing check (`authHeader.startsWith("Bearer ") && authHeader.length > 20`) accepts any long-enough string as valid. This endpoint triggers Ozow bank payouts — it must be restricted to admin users and internal service callers only.

## Exact change (lines 98-101 only)

**Remove:**
```typescript
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    if (!authHeader.startsWith("Bearer ") || authHeader.length < 20) return jsonResponse({ error: "Unauthorized" }, 401);
```

**Insert:**
```typescript
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    if (!authHeader.startsWith("Bearer ")) return jsonResponse({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return jsonResponse({ error: "Unauthorized" }, 401);

    let isAuthorized = false;

    // Path 1: Machine-to-machine via service role key
    if (token === serviceKey) {
      isAuthorized = true;
    } else {
      // Path 2: Human admin via validated JWT
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const authClient = createClient(supabaseUrl, anonKey);
      const { data: { user }, error: userErr } = await authClient.auth.getUser(token);
      if (userErr || !user) return jsonResponse({ error: "Unauthorized" }, 401);

      const adminClient = createClient(supabaseUrl, serviceKey);
      const { data: roleRow } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleRow?.role === "admin") isAuthorized = true;
    }

    if (!isAuthorized) return jsonResponse({ error: "Forbidden" }, 403);
```

## What will NOT change
- Ozow payout logic, encryption, HashCheck calculation, bankingDetails payload
- `corsHeaders`, `REQUIRED_BANK_FIELDS`, `SENSITIVE_KEYS`
- Any helper functions (jsonResponse, formatCents, maskAccountNumber, generateHashCheck, buildBankingDetailsPayload, handlePayoutNotify)
- All lines before 97 and after 101 remain untouched

## Deployment
- Deploy only this function after the edit: `supabase functions deploy trigger-vendor-payout`

## Rollback risk
- Internal callers (e.g. `release-escrow`, `ozow-webhook`) currently passing user JWTs will receive 403. They must switch to passing the service role key as the Bearer token for machine-to-machine access.