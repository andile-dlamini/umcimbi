import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REQUIRED_BANK_FIELDS = [
  "bank_name",
  "bank_account_holder_name",
  "bank_account_number",
  "bank_account_type",
  "bank_branch_code",
] as const;

const SENSITIVE_KEYS = [
  "accountnumber",
  "account_number",
  "branchcode",
  "branch_code",
  "bankaccountnumber",
  "bankbranchcode",
  "bankdetails",
  "authorization",
  "accesstoken",
  "encryptionkey",
  "encryption_key",
];

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isSensitiveKey(key: string) {
  const normalized = key.toLowerCase().replace(/[^a-z0-9_]/g, "");
  return SENSITIVE_KEYS.some((sensitive) => normalized.includes(sensitive));
}

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, isSensitiveKey(key) ? "[REDACTED]" : redactValue(nested)])
    );
  }
  return value;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getPayoutStatusObject(response: Record<string, unknown>): Record<string, unknown> | null {
  const ps = (response.payoutStatus ?? response.PayoutStatus) as unknown;
  if (ps && typeof ps === "object") return ps as Record<string, unknown>;
  return null;
}

function normalizeInitialStatus(response: Record<string, unknown>, ok: boolean) {
  if (!ok) return "failed";
  // Ozow nested payoutStatus.status: 1 = PayoutReceived, 3 = SubmittedForProcessing
  const ps = getPayoutStatusObject(response);
  if (ps) {
    const code = Number(ps.status ?? ps.Status);
    if (code === 1 || code === 3) {
      const sub = Number(ps.subStatus ?? ps.SubStatus ?? 0);
      if (sub === 101) return "failed";
      return "submitted";
    }
    return "failed";
  }
  // Fallback: legacy string-based status checking
  const status = String(response.status ?? response.Status ?? "").toLowerCase();
  if (["rejected", "declined", "failed", "error"].some((value) => status.includes(value))) {
    return status.includes("reject") || status.includes("declin") ? "rejected" : "failed";
  }
  return "submitted";
}

function extractResponseRef(response: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = response[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
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

    const payoutApiUrl = (Deno.env.get("OZOW_PAYOUT_API_URL") ?? "").trim().replace(/\/+$/, "");
    const ozowSiteCode = (Deno.env.get("OZOW_SITE_CODE") ?? "").trim();
    const ozowPayoutApiKey = (Deno.env.get("OZOW_PAYOUT_API_KEY") ?? "").trim();
    const notifyUrl = (Deno.env.get("OZOW_PAYOUT_NOTIFY_URL") ?? "").trim();

    if (!payoutApiUrl || !ozowSiteCode || !ozowPayoutApiKey || !notifyUrl) {
      return jsonResponse({ error: "Payout service not configured" }, 500);
    }

    const body = await req.json();
    const { booking_id } = body;
    const payout_type: string = body.payout_type || "balance";
    const override_amount: number | null = body.override_amount ?? null;
    if (!booking_id) return jsonResponse({ error: "booking_id is required" }, 400);

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, vendor_id, agreed_price, deposit_amount, balance_amount, deposit_status, booking_status, funds_released_at, order_number")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) return jsonResponse({ error: "Booking not found" }, 404);
    if (payout_type === "deposit") {
      if (booking.booking_status !== "confirmed" || booking.deposit_status !== "paid") {
        return jsonResponse({ error: "Booking deposit not eligible for payout" }, 400);
      }
    } else {
      if (!["completed", "disputed"].includes(booking.booking_status)) {
        return jsonResponse({ error: "Booking is not eligible for payout" }, 400);
      }
    }

    const { data: duplicate } = await supabase
      .from("vendor_payouts")
      .select("id, status")
      .eq("booking_id", booking_id)
      .eq("payout_type", payout_type)
      .in("status", ["pending", "submitted", "paid"])
      .limit(1)
      .maybeSingle();

    if (duplicate) return jsonResponse({ error: "Payout already exists for this booking", vendor_payout_id: duplicate.id, status: duplicate.status }, 409);

    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, name, bank_name, bank_account_holder_name, bank_account_number, bank_account_type, bank_branch_code")
      .eq("id", booking.vendor_id)
      .single();

    if (vendorError || !vendor) return jsonResponse({ error: "Vendor not found" }, 404);

    const missingFields = REQUIRED_BANK_FIELDS.filter((field) => !String(vendor[field] ?? "").trim());
    if (missingFields.length > 0) return jsonResponse({ error: "Vendor payout details incomplete", missing_fields: missingFields }, 400);

    const amount = override_amount !== null
      ? override_amount
      : payout_type === "deposit"
        ? Math.round((Number(booking.deposit_amount) / 1.08) * 100) / 100
        : Math.round((Number(booking.balance_amount) / 1.08) * 100) / 100;
    if (!Number.isFinite(amount) || amount <= 0) return jsonResponse({ error: "Invalid payout amount" }, 400);

    // 1. Resolve BankGroupId via Ozow getavailablebanks
    let banks: Array<{ bankGroupId: string; bankGroupName: string; universalBranchCode: string }> = [];
    const banksUrl = `${payoutApiUrl}/getavailablebanks`;
    
    try {
      const banksRes = await fetch(banksUrl, {
        method: "GET",
        headers: {
          "ApiKey": ozowPayoutApiKey,
          "SiteCode": ozowSiteCode,
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      if (!banksRes.ok) {
        const errBody = await banksRes.text();
        console.error("getavailablebanks non-OK status:", banksRes.status, "body:", errBody);
        return jsonResponse({ error: "Failed to fetch supported banks from Ozow" }, 502);
      }
      banks = await banksRes.json();
    } catch (err) {
      console.error("getavailablebanks error:", err);
      return jsonResponse({ error: "Failed to fetch supported banks from Ozow" }, 502);
    }

    if (!Array.isArray(banks) || banks.length === 0) {
      return jsonResponse({ error: "Failed to fetch supported banks from Ozow" }, 502);
    }

    const vendorBankLower = vendor.bank_name.toLowerCase();
    const matchedBank = banks.find((b) => {
      const name = (b.bankGroupName ?? "").toLowerCase();
      if (!name) return false;
      return name.includes(vendorBankLower) || vendorBankLower.includes(name);
    });

    if (!matchedBank) {
      return jsonResponse({ error: `Vendor bank "${vendor.bank_name}" is not supported by Ozow` }, 400);
    }

    const bankGroupId = matchedBank.bankGroupId;
    const universalBranchCode = matchedBank.universalBranchCode;

    // 2. References (max 20 chars; alphanumeric + dashes)
    const internalReference = `UMC-P-${Date.now()}-${booking.id.replace(/-/g, "").slice(0, 8)}`;
    const merchantReference = (booking.order_number ?? booking.id).substring(0, 20);
    const customerBankReference = `UMC-${booking.id.substring(0, 9)}-${Date.now().toString().slice(-4)}`.substring(0, 20);
    const amountInCents = Math.round(amount * 100);

    // 3. Encrypt account number per Ozow spec (AES-256-CBC, base64 output)
    const rawKey = crypto.randomUUID().replace(/-/g, "").substring(0, 20);
    let encryptionKey = rawKey;
    while (encryptionKey.length < 32) {
      encryptionKey += rawKey;
    }
    encryptionKey = encryptionKey.substring(0, 32);

    const ivInput = `${merchantReference}${amountInCents}${rawKey}`.toLowerCase();
    const ivHashBuffer = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(ivInput));
    const ivHex = Array.from(new Uint8Array(ivHashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const iv = ivHex.substring(0, 16);

    const keyBytes = new TextEncoder().encode(encryptionKey);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-CBC" },
      false,
      ["encrypt"],
    );

    const ivBytes = new TextEncoder().encode(iv);
    const accountNumberBytes = new TextEncoder().encode(vendor.bank_account_number);
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "AES-CBC", iv: ivBytes },
      cryptoKey,
      accountNumberBytes,
    );
    const encryptedAccountNumber = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));

    // 4. HashCheck (SHA-512 over lowercase concat in spec order — flat field order)
    const isRtc = false;
    const hashInput = [
      ozowSiteCode,
      amountInCents,
      merchantReference,
      customerBankReference,
      isRtc,
      notifyUrl,
      bankGroupId,
      encryptedAccountNumber,
      universalBranchCode,
      ozowPayoutApiKey,
    ].join("").toLowerCase();
    const hashBuffer = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(hashInput));
    const hashCheck = bytesToHex(new Uint8Array(hashBuffer));

    // 5. Build Ozow-spec payload (nested bankingDetails)
    const payoutPayload = {
      SiteCode: ozowSiteCode,
      Amount: amount,
      MerchantReference: merchantReference,
      CustomerBankReference: customerBankReference,
      IsRtc: isRtc,
      NotifyUrl: notifyUrl,
      bankingDetails: {
        bankGroupId: bankGroupId,
        accountNumber: encryptedAccountNumber,
        branchCode: universalBranchCode,
      },
      HashCheck: hashCheck,
    };

    const { data: payout, error: insertError } = await supabase
      .from("vendor_payouts")
      .insert({
        booking_id: booking.id,
        vendor_id: booking.vendor_id,
        amount,
        currency: "ZAR",
        internal_reference: internalReference,
        status: "pending",
        payout_type,
        request_payload: redactValue(payoutPayload),
        encryption_key: rawKey,
        bank_group_id: bankGroupId,
      })
      .select("id")
      .single();

    // Unique-violation (23505) means a concurrent invocation already created an
    // active payout for this booking/payout_type. Return the same 409 as the read
    // guard above — and critically, before any request reaches Ozow.
    if (insertError && (insertError as { code?: string }).code === "23505") {
      console.error("trigger-vendor-payout: duplicate blocked by unique index", {
        booking_id: booking.id,
        payout_type,
      });
      return jsonResponse({ error: "Payout already exists for this booking", status: "duplicate_blocked" }, 409);
    }

    if (insertError || !payout) return jsonResponse({ error: "Failed to create payout record" }, 500);

    let responsePayload: Record<string, unknown> = {};
    let responseOk = false;
    let responseStatus = 0;

    try {
      const outboundHeaders = {
        "Content-Type": "application/json",
        "SiteCode": ozowSiteCode,
        "ApiKey": ozowPayoutApiKey,
      };
      const ozowRes = await fetch(`${payoutApiUrl}/requestpayout`, {
        method: "POST",
        headers: outboundHeaders,
        body: JSON.stringify(payoutPayload),
      });
      responseOk = ozowRes.ok;
      responseStatus = ozowRes.status;
      const text = await ozowRes.text();
      
      responsePayload = text ? JSON.parse(text) : {};
    } catch (err) {
      responsePayload = { error: err instanceof Error ? err.message : "Ozow payout request failed" };
    }

    const initialStatus = normalizeInitialStatus(responsePayload, responseOk);
    const payoutStatusObj = getPayoutStatusObject(responsePayload);
    const failureReason = initialStatus === "failed" || initialStatus === "rejected"
      ? String(
          (payoutStatusObj?.errorMessage ?? payoutStatusObj?.ErrorMessage) ??
          responsePayload.errorMessage ?? responsePayload.ErrorMessage ??
          responsePayload.message ?? responsePayload.Message ??
          `Ozow response status ${responseStatus || "unavailable"}`
        )
      : null;

    await supabase
      .from("vendor_payouts")
      .update({
        status: initialStatus,
        ozow_payout_id: extractResponseRef(responsePayload, ["payoutId", "PayoutId", "ozowPayoutId", "OzowPayoutId"])
          ?? (payoutStatusObj ? extractResponseRef(payoutStatusObj, ["payoutId", "PayoutId", "ozowPayoutId", "OzowPayoutId"]) : null),
        ozow_reference: extractResponseRef(responsePayload, ["reference", "Reference", "ozowReference", "OzowReference"]),
        response_payload: redactValue(responsePayload),
        submitted_at: initialStatus === "submitted" ? new Date().toISOString() : null,
        failed_at: failureReason ? new Date().toISOString() : null,
        failure_reason: failureReason,
      })
      .eq("id", payout.id);

    if (failureReason) return jsonResponse({ success: false, vendor_payout_id: payout.id, status: initialStatus, error: failureReason }, 502);
    return jsonResponse({ success: true, vendor_payout_id: payout.id, status: initialStatus });
  } catch (err) {
    console.error("trigger-vendor-payout error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
