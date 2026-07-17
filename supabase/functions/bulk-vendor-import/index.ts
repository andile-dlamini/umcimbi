// Admin vendor management. Actions:
//   - create_vendor_account: create shadow auth user + profile (no vendor row yet)
//   - send_registration_sms: send bulk registration SMS to given vendors
//   - release_to_public: flip is_active=true on given vendors
//   - get_login_status: report whether each vendor has signed in
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { renderSms, normalizeSaPhone, sendConnectMobileSms } from "../_shared/smsTemplates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizePhone(raw: string): string {
  let n = String(raw).replace(/\s/g, "");
  if (n.startsWith("0")) n = "+27" + n.slice(1);
  if (!n.startsWith("+")) n = "+" + n;
  return n;
}

async function requireAdmin(req: Request): Promise<{ ok: true; userId: string } | Response> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "Unauthorized" }, 401);

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
  if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
  const userId = claims.claims.sub as string;

  const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isAdmin) return json({ error: "Forbidden" }, 403);
  return { ok: true, userId };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const gate = await requireAdmin(req);
    if (gate instanceof Response) return gate;

    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const action = body?.action;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    if (action === "create_vendor_account") {
      const name = String(body?.name ?? "").trim();
      const phoneRaw = String(body?.phone_number ?? "").trim();
      if (!name || !phoneRaw) return json({ error: "name and phone_number required" }, 400);

      const normalized = normalizePhone(phoneRaw);

      const { data: existing } = await admin
        .from("profiles")
        .select("user_id")
        .eq("phone_number", normalized)
        .maybeSingle();
      if (existing) return json({ error: "phone_already_registered" }, 409);

      const shadowEmail = `${normalized.replace("+", "")}@phone.isiko.app`;
      const password = crypto.randomUUID();

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: shadowEmail,
        password,
        phone: normalized,
        phone_confirm: true,
        email_confirm: true,
        user_metadata: { full_name: name },
      });
      if (createErr || !created?.user) {
        return json({ error: createErr?.message ?? "auth_create_failed" }, 500);
      }
      const userId = created.user.id;

      const { error: profErr } = await admin
        .from("profiles")
        .update({ phone_number: normalized, full_name: name, phone_verified: true })
        .eq("user_id", userId);
      if (profErr) {
        // Roll back the auth user so a retry with the same phone number is clean
        await admin.auth.admin.deleteUser(userId).catch(() => {});
        return json({ error: `profile_update_failed: ${profErr.message}` }, 500);
      }

      return json({ user_id: userId });
    }

    if (action === "send_registration_sms") {
      const vendorIds = Array.isArray(body?.vendor_ids) ? (body.vendor_ids as string[]) : null;
      if (!vendorIds) return json({ error: "vendor_ids must be an array" }, 400);
      const results: any[] = [];
      for (const vendorId of vendorIds) {
        try {
          const { data: vendor, error: vErr } = await admin
            .from("vendors")
            .select("id, name, phone_number")
            .eq("id", vendorId)
            .maybeSingle();
          if (vErr || !vendor) {
            results.push({ vendor_id: vendorId, status: "failed", reason: vErr?.message ?? "vendor_not_found" });
            continue;
          }
          const phoneForSms = normalizeSaPhone(String((vendor as any).phone_number ?? ""));
          if (!phoneForSms) {
            results.push({ vendor_id: vendorId, status: "failed", reason: "invalid_phone" });
            continue;
          }
          const smsBody = renderSms("vendor_bulk_registered", { name: (vendor as any).name });
          const msgId = `bulk-${vendorId}-${Date.now()}`;
          await sendConnectMobileSms(phoneForSms, smsBody, msgId);
          results.push({ vendor_id: vendorId, status: "sent" });
        } catch (err) {
          results.push({ vendor_id: vendorId, status: "failed", reason: (err as Error)?.message ?? "sms_failed" });
        }
      }
      return json({ results });
    }

    if (action === "release_to_public") {
      const vendorIds = Array.isArray(body?.vendor_ids) ? (body.vendor_ids as string[]) : null;
      if (!vendorIds) return json({ error: "vendor_ids must be an array" }, 400);
      const results: any[] = [];
      for (const vendorId of vendorIds) {
        try {
          const { error: updErr } = await admin
            .from("vendors")
            .update({ is_active: true })
            .eq("id", vendorId);
          if (updErr) {
            results.push({ vendor_id: vendorId, status: "failed", reason: updErr.message });
            continue;
          }
          results.push({ vendor_id: vendorId, status: "released" });
        } catch (err) {
          results.push({ vendor_id: vendorId, status: "failed", reason: (err as Error)?.message ?? "release_failed" });
        }
      }
      return json({ results });
    }

    if (action === "get_login_status") {
      const vendorIds = Array.isArray(body?.vendor_ids) ? (body.vendor_ids as string[]) : null;
      if (!vendorIds) return json({ error: "vendor_ids must be an array" }, 400);
      const results: any[] = [];
      for (const vendorId of vendorIds) {
        try {
          const { data, error } = await admin.rpc("get_vendor_last_sign_in", { _vendor_id: vendorId });
          if (error) {
            console.error("get_vendor_last_sign_in error", error);
            results.push({ vendor_id: vendorId, has_logged_in: false });
            continue;
          }
          results.push({ vendor_id: vendorId, has_logged_in: data != null });
        } catch (err) {
          console.error("get_login_status err", err);
          results.push({ vendor_id: vendorId, has_logged_in: false });
        }
      }
      return json({ results });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error("bulk-vendor-import top-level error", err);
    return json({ error: (err as Error)?.message ?? "unexpected_error" }, 500);
  }
});
