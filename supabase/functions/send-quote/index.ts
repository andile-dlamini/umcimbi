import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  sort_order: number;
}

interface VendorBranding {
  name: string;
  logo_url: string | null;
  registered_business_name: string | null;
  registration_number: string | null;
  vat_number: string | null;
  show_registration_on_pdf: boolean;
  show_vat_on_pdf: boolean;
  letterhead_enabled: boolean;
  phone_number: string | null;
  email: string | null;
  website_url: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string | null;
}

function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatCurrency(amount: number): string {
  return `R${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });
}

function buildVendorAddress(vendor: VendorBranding): string {
  return [vendor.address_line_1, vendor.address_line_2, vendor.city, vendor.state_province, vendor.postal_code, vendor.country].filter(Boolean).join(", ");
}

function renderLetterheadHeader(vendor: VendorBranding, logoDataUrl: string | null): string {
  const businessName = vendor.registered_business_name || vendor.name;
  const address = buildVendorAddress(vendor);
  const contactParts: string[] = [];
  if (vendor.phone_number) contactParts.push(escapeHtml(vendor.phone_number));
  if (vendor.email) contactParts.push(escapeHtml(vendor.email));
  if (vendor.website_url) contactParts.push(escapeHtml(vendor.website_url));
  const regLine = vendor.show_registration_on_pdf && vendor.registration_number ? `<p style="margin:0;font-size:10px;color:#666;">Reg No: ${escapeHtml(vendor.registration_number)}</p>` : "";
  const vatLine = vendor.show_vat_on_pdf && vendor.vat_number ? `<p style="margin:0;font-size:10px;color:#666;">VAT No: ${escapeHtml(vendor.vat_number)}</p>` : "";
  const logoHtml = logoDataUrl ? `<img src="${logoDataUrl}" style="max-width:120px;max-height:80px;object-fit:contain;" />` : "";
  return `<div style="display:flex;align-items:flex-start;justify-content:space-between;border-bottom:2px solid #B8860B;padding-bottom:16px;margin-bottom:24px;">
    <div style="flex:0 0 auto;">${logoHtml}</div>
    <div style="text-align:right;">
      <h2 style="margin:0;font-size:18px;font-weight:bold;color:#1a1a1a;">${escapeHtml(businessName)}</h2>
      ${address ? `<p style="margin:2px 0 0;font-size:11px;color:#666;">${escapeHtml(address)}</p>` : ""}
      ${contactParts.length > 0 ? `<p style="margin:2px 0 0;font-size:11px;color:#666;">${contactParts.join(" | ")}</p>` : ""}
      ${regLine}${vatLine}
    </div>
  </div>`;
}

function renderFallbackHeader(vendorName: string): string {
  return `<div style="border-bottom:2px solid #B8860B;padding-bottom:16px;margin-bottom:24px;text-align:center;">
    <h1 style="margin:0;font-size:22px;font-weight:bold;color:#B8860B;letter-spacing:1px;">UMCIMBI</h1>
    <h2 style="margin:6px 0 0;font-size:16px;font-weight:normal;color:#333;">Quotation</h2>
    <p style="margin:4px 0 0;font-size:12px;color:#666;">Prepared by: ${escapeHtml(vendorName)}</p>
  </div>`;
}

function generateQuotePdfHtml(
  vendor: VendorBranding,
  logoDataUrl: string | null,
  lineItems: LineItem[],
  total: number,
  depositPercentage: number,
  notes: string | null,
  offerNumber: string,
  clientProfile: any,
  event: any,
  request: any,
): string {
  const hasLetterhead = !!(vendor.letterhead_enabled || vendor.logo_url || vendor.registered_business_name);
  const header = hasLetterhead ? renderLetterheadHeader(vendor, logoDataUrl) : renderFallbackHeader(vendor.name);
  const clientName = clientProfile?.full_name || clientProfile?.first_name || "Client";
  const eventAddress = event?.location || "";
  const eventTypePretty = event?.type ? event.type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "";
  const platformFee = total * 0.08;
  const clientTotal = total + platformFee;
  const depositAmount = clientTotal * (depositPercentage / 100);
  const balanceAmount = clientTotal - depositAmount;

  const lineItemsHtml = lineItems.map(item => `
    <tr>
      <td>${escapeHtml(item.description)}</td>
      <td style="text-align:center;">${item.quantity}</td>
      <td style="text-align:right;">${formatCurrency(item.unit_price)}</td>
      <td style="text-align:right;">${formatCurrency(item.quantity * item.unit_price)}</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; font-size: 13px; line-height: 1.5; margin: 0; padding: 40px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f5f0e8; text-align: left; padding: 8px 10px; font-size: 12px; border-bottom: 1px solid #ddd; }
  td { padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 12px; }
  .section-title { font-size: 13px; font-weight: 600; color: #B8860B; margin: 20px 0 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
  .info-box { background: #faf8f4; border-radius: 6px; padding: 12px; }
  .info-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
  .info-value { font-size: 13px; font-weight: 500; margin-top: 2px; }
  .total-row { font-weight: bold; font-size: 14px; background: #f5f0e8; }
  .notes-box { background: #faf8f4; border-left: 3px solid #B8860B; padding: 12px; margin: 16px 0; border-radius: 0 6px 6px 0; font-size: 12px; }
  .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; color: #999; }
</style></head><body>
  ${header}
  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:20px;">
    <h1 style="margin:0;font-size:20px;color:#1a1a1a;">Quotation</h1>
    <div style="text-align:right;">
      <p style="margin:0;font-size:11px;color:#888;">Quote Number</p>
      <p style="margin:0;font-size:14px;font-weight:bold;color:#B8860B;">${escapeHtml(offerNumber)}</p>
    </div>
  </div>
  <div class="info-grid">
    <div class="info-box">
      <p class="info-label">Client</p>
      <p class="info-value">${escapeHtml(clientName)}</p>
      ${eventAddress ? `<p style="font-size:11px;color:#666;margin:2px 0 0;">${escapeHtml(eventAddress)}</p>` : ""}
    </div>
    <div class="info-box">
      <p class="info-label">Vendor</p>
      <p class="info-value">${escapeHtml(vendor.registered_business_name || vendor.name)}</p>
      ${buildVendorAddress(vendor) ? `<p style="font-size:11px;color:#666;margin:2px 0 0;">${escapeHtml(buildVendorAddress(vendor))}</p>` : ""}
    </div>
  </div>
  <p style="font-size:11px;color:#666;margin-bottom:16px;"><strong>Issue Date:</strong> ${formatDate(new Date().toISOString())}</p>
  ${event ? `
  <p class="section-title">Event Details</p>
  <table>
    ${eventTypePretty ? `<tr><td style="width:30%;color:#666;">Event Type</td><td>${escapeHtml(eventTypePretty)}</td></tr>` : ""}
    ${event.date ? `<tr><td style="color:#666;">Date</td><td>${formatDate(event.date)}</td></tr>` : ""}
    ${event.location ? `<tr><td style="color:#666;">Location</td><td>${escapeHtml(event.location)}</td></tr>` : ""}
    ${request?.guest_count ? `<tr><td style="color:#666;">Guest Count</td><td>${request.guest_count}</td></tr>` : ""}
  </table>` : ""}
  <p class="section-title">Quotation Details</p>
  <table>
    <thead><tr><th>Description</th><th style="text-align:center;width:10%;">Qty</th><th style="text-align:right;width:20%;">Unit Price</th><th style="text-align:right;width:20%;">Amount</th></tr></thead>
    <tbody>
      ${lineItemsHtml}
      <tr><td colspan="3" style="text-align:right;font-size:12px;">Subtotal</td><td style="text-align:right;">${formatCurrency(total)}</td></tr>
      <tr><td colspan="3" style="text-align:right;color:#666;font-size:11px;">Service fee (8%)</td><td style="text-align:right;font-size:11px;">${formatCurrency(platformFee)}</td></tr>
      <tr class="total-row"><td colspan="3">Total (ZAR)</td><td style="text-align:right;">${formatCurrency(clientTotal)}</td></tr>
    </tbody>
  </table>
  <p class="section-title">Payment Terms</p>
  <div class="notes-box">
    <p style="margin:0;">Deposit: ${depositPercentage}% — ${formatCurrency(depositAmount)}</p>
    <p style="margin:4px 0 0;">Balance: ${100 - depositPercentage}% — ${formatCurrency(balanceAmount)}</p>
    <p style="margin:8px 0 0;font-size:11px;color:#888;">Deposit due upon acceptance. Balance due before or on event day.</p>
  </div>
  ${notes ? `<p class="section-title">Notes</p><div class="notes-box">${escapeHtml(notes)}</div>` : ""}
  <div class="footer"><p>Generated via UMCIMBI &bull; This quotation is valid for 48 hours from issue date.</p></div>
</body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { conversation_id, event_id, request_id, deposit_percentage = 50, notes, line_items, quote_id } = await req.json();

    if (!conversation_id || !line_items || !Array.isArray(line_items) || line_items.length === 0) {
      return new Response(JSON.stringify({ error: "conversation_id and line_items are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 1) Validate vendor owns this conversation
    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .select("id, user_id, vendor_id, event_id")
      .eq("id", conversation_id)
      .single();

    if (convError || !conv) {
      return new Response(JSON.stringify({ error: "Conversation not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, owner_user_id, name, logo_url, registered_business_name, registration_number, vat_number, show_registration_on_pdf, show_vat_on_pdf, letterhead_enabled, phone_number, email, website_url, address_line_1, address_line_2, city, state_province, postal_code, country, category")
      .eq("id", conv.vendor_id)
      .single();

    if (vendorError || !vendor || vendor.owner_user_id !== user.id) {
      return new Response(JSON.stringify({ error: "You do not own this conversation's vendor" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let effectiveEventId = event_id || conv.event_id;

    // If no event_id, find the seeker's latest event
    if (!effectiveEventId) {
      const { data: latestEvent } = await supabase
        .from("events")
        .select("id")
        .eq("owner_user_id", conv.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestEvent) {
        effectiveEventId = latestEvent.id;
        // Link conversation to this event for future use
        await supabase.from("conversations").update({ event_id: effectiveEventId }).eq("id", conversation_id);
      }
    }

    if (!effectiveEventId) {
      return new Response(JSON.stringify({ error: "No event found. The client must create an event first." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2) Find or create service_request
    let serviceRequestId = request_id;
    if (!serviceRequestId) {
      // Try to find existing request (any status - we'll reuse it for new quotes)
      const { data: existingReq } = await supabase
        .from("service_requests")
        .select("id, status")
        .eq("vendor_id", conv.vendor_id)
        .eq("requester_user_id", conv.user_id)
        .eq("event_id", effectiveEventId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingReq) {
        serviceRequestId = existingReq.id;
        // Reset status to pending if it was in a terminal state, so new quote flow works
        if (!["pending", "quoted"].includes(existingReq.status)) {
          await supabase
            .from("service_requests")
            .update({ status: "pending", responded_at: null })
            .eq("id", existingReq.id);
        }
      }
    }

    if (!serviceRequestId) {
      // Create minimal service request
      const { data: newReq, error: reqErr } = await supabase
        .from("service_requests")
        .insert({
          event_id: effectiveEventId,
          vendor_id: conv.vendor_id,
          requester_user_id: conv.user_id,
          status: "pending",
          origin: "vendor_initiated",
        })
        .select("id")
        .single();

      if (reqErr) {
        console.error("Error creating service request:", reqErr);
        return new Response(JSON.stringify({ error: "Failed to create service request" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      serviceRequestId = newReq.id;
    }

    // 3) Compute total
    const total = line_items.reduce((sum: number, item: LineItem) => sum + item.quantity * item.unit_price, 0);

    // 4) Generate offer number
    const { data: offerNumResult } = await supabase.rpc("generate_offer_number" as any);
    const offerNumber = (offerNumResult as unknown as string) || `UMC-Q-${Date.now()}`;

    // 5) Insert quote
    const { data: quote, error: quoteErr } = await supabase
      .from("quotes")
      .insert({
        request_id: serviceRequestId,
        vendor_id: conv.vendor_id,
        price: total,
        notes: notes || null,
        deposit_percentage: deposit_percentage,
        status: "pending_client",
        sent_at: new Date().toISOString(),
        offer_number: offerNumber,
      })
      .select("id")
      .single();

    if (quoteErr) {
      console.error("Error creating quote:", quoteErr);
      return new Response(JSON.stringify({ error: "Failed to create quote" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 6) Insert line items
    const lineItemRows = line_items.map((item: LineItem, idx: number) => ({
      quote_id: quote.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      sort_order: item.sort_order ?? idx,
    }));

    await supabase.from("quote_line_items").insert(lineItemRows);

    // 7) Fetch client profile + event for PDF
    const { data: clientProfile } = await supabase
      .from("profiles")
      .select("full_name, first_name, email, phone_number")
      .eq("user_id", conv.user_id)
      .single();

    let event = null;
    if (effectiveEventId) {
      const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .eq("id", effectiveEventId)
        .single();
      event = eventData;
    }

    let requestData = null;
    if (serviceRequestId) {
      const { data: reqData } = await supabase
        .from("service_requests")
        .select("guest_count, event_date")
        .eq("id", serviceRequestId)
        .single();
      requestData = reqData;
    }

    // Fetch logo as data URL
    let logoDataUrl: string | null = null;
    if (vendor.logo_url) {
      try {
        const logoRes = await fetch(vendor.logo_url);
        if (logoRes.ok) {
          const blob = await logoRes.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(blob)));
          const contentType = logoRes.headers.get("content-type") || "image/png";
          logoDataUrl = `data:${contentType};base64,${base64}`;
        }
      } catch { /* skip */ }
    }

    // 8) Generate PDF HTML
    const html = generateQuotePdfHtml(
      vendor as VendorBranding,
      logoDataUrl,
      line_items,
      total,
      deposit_percentage,
      notes,
      offerNumber,
      clientProfile,
      event,
      requestData,
    );

    const htmlBytes = new TextEncoder().encode(html);
    const pdfKey = `offers/${quote.id}/${offerNumber}.html`;

    const { error: uploadError } = await supabase.storage
      .from("quote-pdfs")
      .upload(pdfKey, htmlBytes, { contentType: "text/html", upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Failed to store document" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Update quote with PDF key
    await supabase.from("quotes").update({
      final_offer_pdf_key: pdfKey,
      final_offer_pdf_generated_at: new Date().toISOString(),
    }).eq("id", quote.id);

    // 9) Insert quote_card message into chat
    const depositAmountChat = total * 1.08 * (deposit_percentage / 100);
    const platformFeeChat = total * 0.08;
    await supabase.from("messages").insert({
      conversation_id: conversation_id,
      sender_type: "vendor",
      sender_user_id: user.id,
      message_type: "quote_card",
      content: `📋 Quotation ${offerNumber} — ${formatCurrency(total)}`,
      metadata: {
        quote_id: quote.id,
        offer_number: offerNumber,
        total: total,
        deposit_percentage: deposit_percentage,
        deposit_amount: depositAmountChat,
        platform_fee: platformFeeChat,
        vendor_payout: total,
        pdf_key: pdfKey,
        status: "pending_client",
        booking_id: null,
      },
      attachments: [],
    });

    // Update conversation last_message_at
    await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversation_id);

    // 10) Update service_request status
    await supabase.from("service_requests").update({
      status: "quoted",
      quoted_amount: total,
      vendor_response: notes || "Quote sent via chat",
      responded_at: new Date().toISOString(),
    }).eq("id", serviceRequestId);

    return new Response(
      JSON.stringify({ quote_id: quote.id, offer_number: offerNumber, conversation_id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
