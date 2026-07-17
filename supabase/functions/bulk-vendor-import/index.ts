// Bulk vendor import (admin only). Two actions:
//   - create_vendors: create auth users + profiles + vendors + send welcome SMS
//   - attach_media: append logo/gallery URLs and insert verification documents
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

type DocType = "cipc_registration" | "proof_of_address" | "bank_confirmation" | "vat_certificate" | "other";

interface CreateRow {
  name?: string;
  category?: string;
  whatsapp_number?: string | null;
  phone_number?: string;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  location?: string | null;
  about?: string | null;
  price_range_text?: string | null;
  languages?: string[] | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  facebook_url?: string | null;
  website_url?: string | null;
  is_registered_business?: boolean;
  registered_business_name?: string | null;
  registration_number?: string | null;
  vat_number?: string | null;
  bank_name?: string | null;
  bank_account_holder_name?: string | null;
  bank_account_number?: string | null;
  bank_branch_code?: string | null;
  bank_account_type?: string | null;
}

interface AttachEntry {
  vendor_id: string;
  logo_url?: string | null;
  image_urls?: string[];
  verification_documents?: { doc_type: DocType; file_url: string }[];
}

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

async function handleCreateVendors(admin: ReturnType<typeof createClient>, rows: CreateRow[]) {
  const results: any[] = [];

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    try {
      if (!row.name || !row.category || !row.phone_number) {
        results.push({ row: idx, status: "failed", reason: "missing_required_fields" });
        continue;
      }

      const normalized = normalizePhone(row.phone_number);

      // Skip if phone already registered
      const { data: existing } = await admin
        .from("profiles")
        .select("user_id")
        .eq("phone_number", normalized)
        .maybeSingle();

      if (existing) {
        results.push({ row: idx, status: "skipped", reason: "phone_already_registered" });
        continue;
      }

      const shadowEmail = `${normalized.replace("+", "")}@phone.isiko.app`;
      const password = crypto.randomUUID();

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: shadowEmail,
        password,
        phone: normalized,
        phone_confirm: true,
        email_confirm: true,
        user_metadata: { full_name: row.name },
      });

      if (createErr || !created?.user) {
        results.push({ row: idx, status: "failed", reason: createErr?.message ?? "auth_create_failed" });
        continue;
      }

      const userId = created.user.id;

      // Ensure profile has name + phone (handle_new_user trigger creates the base row)
      const { error: profErr } = await admin
        .from("profiles")
        .update({ phone_number: normalized, full_name: row.name, phone_verified: true })
        .eq("user_id", userId);

      if (profErr) {
        console.error("profile update failed", profErr);
      }

      const isReg = !!row.is_registered_business;
      const vendorInsert: Record<string, unknown> = {
        owner_user_id: userId,
        name: row.name,
        category: row.category,
        whatsapp_number: row.whatsapp_number ?? null,
        phone_number: normalized,
        address_line_1: row.address_line_1 ?? null,
        address_line_2: row.address_line_2 ?? null,
        city: row.city ?? null,
        location: row.location ?? null,
        about: row.about ?? null,
        price_range_text: row.price_range_text ?? null,
        languages: row.languages && row.languages.length ? row.languages : ["English"],
        instagram_url: row.instagram_url ?? null,
        tiktok_url: row.tiktok_url ?? null,
        facebook_url: row.facebook_url ?? null,
        website_url: row.website_url ?? null,
        bank_name: row.bank_name ?? null,
        bank_account_holder_name: row.bank_account_holder_name ?? null,
        bank_account_number: row.bank_account_number ?? null,
        bank_branch_code: row.bank_branch_code ?? null,
        bank_account_type: row.bank_account_type ?? null,
        is_active: false,
        signup_source: "admin_bulk_import",
        vendor_business_type: isReg ? "registered_business" : "independent",
        business_verification_status: isReg ? "pending" : "not_applicable",
        registered_business_name: isReg ? row.registered_business_name ?? null : null,
        registration_number: isReg ? row.registration_number ?? null : null,
        vat_number: isReg ? row.vat_number ?? null : null,
      };

      const { data: vendor, error: vendorErr } = await admin
        .from("vendors")
        .insert(vendorInsert)
        .select("id")
        .single();

      if (vendorErr || !vendor) {
        // Roll back auth user so retry is clean
        await admin.auth.admin.deleteUser(userId).catch(() => {});
        results.push({ row: idx, status: "failed", reason: vendorErr?.message ?? "vendor_insert_failed" });
        continue;
      }


      results.push({
        row: idx,
        status: "created",
        vendor_id: vendor.id,
        user_id: userId,
        is_registered_business: isReg,
        name: row.name,
      });
    } catch (err) {
      results.push({ row: idx, status: "failed", reason: (err as Error)?.message ?? "unexpected_error" });
    }
  }

  return results;
}

async function handleAttachMedia(admin: ReturnType<typeof createClient>, entries: AttachEntry[]) {
  const results: any[] = [];
  for (const entry of entries) {
    try {
      if (!entry.vendor_id) {
        results.push({ vendor_id: entry.vendor_id ?? null, status: "failed", reason: "missing_vendor_id" });
        continue;
      }

      // Handle logo + gallery
      if (entry.logo_url || (entry.image_urls && entry.image_urls.length)) {
        const { data: current, error: fetchErr } = await admin
          .from("vendors")
          .select("image_urls")
          .eq("id", entry.vendor_id)
          .single();
        if (fetchErr) {
          results.push({ vendor_id: entry.vendor_id, status: "failed", reason: fetchErr.message });
          continue;
        }

        const existingUrls: string[] = Array.isArray((current as any)?.image_urls) ? (current as any).image_urls : [];
        const newUrls = entry.image_urls ?? [];
        const merged = Array.from(new Set([...existingUrls, ...newUrls]));

        const patch: Record<string, unknown> = {};
        if (entry.logo_url) patch.logo_url = entry.logo_url;
        if (newUrls.length) patch.image_urls = merged;

        const { error: updErr } = await admin.from("vendors").update(patch).eq("id", entry.vendor_id);
        if (updErr) {
          results.push({ vendor_id: entry.vendor_id, status: "failed", reason: updErr.message });
          continue;
        }
      }

      // Verification documents
      if (entry.verification_documents && entry.verification_documents.length) {
        const rows = entry.verification_documents.map((d) => ({
          vendor_id: entry.vendor_id,
          doc_type: d.doc_type,
          file_url: d.file_url,
          status: "uploaded" as const,
        }));
        const { error: docErr } = await admin.from("vendor_verification_documents").insert(rows);
        if (docErr) {
          results.push({ vendor_id: entry.vendor_id, status: "failed", reason: docErr.message });
          continue;
        }
      }

      results.push({ vendor_id: entry.vendor_id, status: "updated" });
    } catch (err) {
      results.push({ vendor_id: entry.vendor_id, status: "failed", reason: (err as Error)?.message ?? "unexpected_error" });
    }
  }
  return results;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

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

  if (action === "create_vendors") {
    const rows = Array.isArray(body?.rows) ? (body.rows as CreateRow[]) : null;
    if (!rows) return json({ error: "rows must be an array" }, 400);
    const results = await handleCreateVendors(admin, rows);
    return json({ results });
  }

  if (action === "attach_media") {
    const entries = Array.isArray(body?.entries) ? (body.entries as AttachEntry[]) : null;
    if (!entries) return json({ error: "entries must be an array" }, 400);
    const results = await handleAttachMedia(admin, entries);
    return json({ results });
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
});

