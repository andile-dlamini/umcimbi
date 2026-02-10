import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface VendorBranding {
  name: string;
  logo_url: string | null;
  registered_business_name: string | null;
  registration_number: string | null;
  vat_number: string | null;
  show_registration_on_pdf: boolean;
  show_vat_on_pdf: boolean;
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
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatCurrency(amount: number): string {
  return `R${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });
}

function buildVendorAddress(vendor: VendorBranding): string {
  const parts = [
    vendor.address_line_1,
    vendor.address_line_2,
    vendor.city,
    vendor.state_province,
    vendor.postal_code,
    vendor.country,
  ].filter(Boolean);
  return parts.join(", ");
}

function renderLetterheadHeader(vendor: VendorBranding, logoDataUrl: string | null): string {
  const businessName = vendor.registered_business_name || vendor.name;
  const address = buildVendorAddress(vendor);
  const contactParts: string[] = [];
  if (vendor.phone_number) contactParts.push(escapeHtml(vendor.phone_number));
  if (vendor.email) contactParts.push(escapeHtml(vendor.email));
  if (vendor.website_url) contactParts.push(escapeHtml(vendor.website_url));

  const regLine =
    vendor.show_registration_on_pdf && vendor.registration_number
      ? `<p style="margin:0;font-size:10px;color:#666;">Reg No: ${escapeHtml(vendor.registration_number)}</p>`
      : "";
  const vatLine =
    vendor.show_vat_on_pdf && vendor.vat_number
      ? `<p style="margin:0;font-size:10px;color:#666;">VAT No: ${escapeHtml(vendor.vat_number)}</p>`
      : "";

  const logoHtml = logoDataUrl
    ? `<img src="${logoDataUrl}" style="max-width:120px;max-height:80px;object-fit:contain;" />`
    : "";

  return `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;border-bottom:2px solid #B8860B;padding-bottom:16px;margin-bottom:24px;">
      <div style="flex:0 0 auto;">${logoHtml}</div>
      <div style="text-align:right;">
        <h2 style="margin:0;font-size:18px;font-weight:bold;color:#1a1a1a;">${escapeHtml(businessName)}</h2>
        ${address ? `<p style="margin:2px 0 0;font-size:11px;color:#666;">${escapeHtml(address)}</p>` : ""}
        ${contactParts.length > 0 ? `<p style="margin:2px 0 0;font-size:11px;color:#666;">${contactParts.join(" | ")}</p>` : ""}
        ${regLine}
        ${vatLine}
      </div>
    </div>
  `;
}

function renderFallbackHeader(vendorName: string): string {
  return `
    <div style="border-bottom:2px solid #B8860B;padding-bottom:16px;margin-bottom:24px;text-align:center;">
      <h1 style="margin:0;font-size:22px;font-weight:bold;color:#B8860B;letter-spacing:1px;">UMCIMBI</h1>
      <h2 style="margin:6px 0 0;font-size:16px;font-weight:normal;color:#333;">Final Offer</h2>
      <p style="margin:4px 0 0;font-size:12px;color:#666;">Prepared by: ${escapeHtml(vendorName)}</p>
    </div>
  `;
}

function generatePdfHtml(
  vendor: VendorBranding,
  logoDataUrl: string | null,
  quote: any,
  request: any,
  event: any,
  clientProfile: any,
  offerNumber: string
): string {
  const hasLetterhead = !!(vendor.logo_url || vendor.registered_business_name);
  const header = hasLetterhead
    ? renderLetterheadHeader(vendor, logoDataUrl)
    : renderFallbackHeader(vendor.name);

  const clientName = clientProfile?.full_name || clientProfile?.first_name || "Client";
  const eventAddress = event?.location || "";
  const eventTypePretty = event?.type ? event.type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
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
</style>
</head>
<body>
  ${header}

  <!-- Document title & number -->
  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:20px;">
    <h1 style="margin:0;font-size:20px;color:#1a1a1a;">Final Offer</h1>
    <div style="text-align:right;">
      <p style="margin:0;font-size:11px;color:#888;">Offer Number</p>
      <p style="margin:0;font-size:14px;font-weight:bold;color:#B8860B;">${escapeHtml(offerNumber)}</p>
    </div>
  </div>

  <!-- Parties -->
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

  <!-- Issue date -->
  <p style="font-size:11px;color:#666;margin-bottom:16px;">
    <strong>Issue Date:</strong> ${formatDate(quote.updated_at || quote.created_at)}
  </p>

  <!-- Event details -->
  ${event ? `
  <p class="section-title">Event Details</p>
  <table>
    ${eventTypePretty ? `<tr><td style="width:30%;color:#666;">Event Type</td><td>${escapeHtml(eventTypePretty)}</td></tr>` : ""}
    ${event.date ? `<tr><td style="color:#666;">Date</td><td>${formatDate(event.date)}</td></tr>` : ""}
    ${event.location ? `<tr><td style="color:#666;">Location</td><td>${escapeHtml(event.location)}</td></tr>` : ""}
    ${request.guest_count ? `<tr><td style="color:#666;">Guest Count</td><td>${request.guest_count}</td></tr>` : ""}
  </table>
  ` : ""}

  <!-- Quote details -->
  <p class="section-title">Quote Details</p>
  <table>
    <thead>
      <tr><th>Description</th><th style="text-align:right;width:30%;">Amount</th></tr>
    </thead>
    <tbody>
      <tr><td>Service fee</td><td style="text-align:right;">${formatCurrency(quote.price)}</td></tr>
      <tr class="total-row"><td>Total (ZAR)</td><td style="text-align:right;">${formatCurrency(quote.price)}</td></tr>
    </tbody>
  </table>

  <!-- Notes -->
  ${quote.notes ? `
  <p class="section-title">Vendor Notes</p>
  <div class="notes-box">${escapeHtml(quote.notes)}</div>
  ` : ""}

  <!-- Payment terms -->
  <p class="section-title">Payment Terms</p>
  <div class="notes-box">Deposit and balance as per booking terms in UMCIMBI. Standard deposit of 30% applies.</div>

  <!-- Footer -->
  <div class="footer">
    <p>Generated via UMCIMBI &bull; This document represents the accepted final offer and serves as a record of agreement.</p>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { quote_id } = await req.json();
    if (!quote_id) {
      return new Response(JSON.stringify({ error: "quote_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch quote with request details
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select("*, request:service_requests(*, event:events(*))")
      .eq("id", quote_id)
      .single();

    if (quoteError || !quote) {
      return new Response(JSON.stringify({ error: "Quote not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is the client
    if (quote.request.requester_user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Only the client can accept this quote" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check quote is still pending
    if (quote.status !== "pending_client") {
      return new Response(JSON.stringify({ error: "Quote is no longer pending" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate offer number
    const { data: offerNumResult } = await supabase.rpc("generate_offer_number" as any);
    const offerNumber = (offerNumResult as unknown as string) || `UMC-Q-${Date.now()}`;

    // Fetch vendor branding
    const { data: vendor } = await supabase
      .from("vendors")
      .select("name, logo_url, registered_business_name, registration_number, vat_number, show_registration_on_pdf, show_vat_on_pdf, phone_number, email, website_url, address_line_1, address_line_2, city, state_province, postal_code, country")
      .eq("id", quote.vendor_id)
      .single();

    // Fetch client profile
    const { data: clientProfile } = await supabase
      .from("profiles")
      .select("full_name, first_name, email, phone_number")
      .eq("user_id", user.id)
      .single();

    // Fetch logo as data URL if exists
    let logoDataUrl: string | null = null;
    if (vendor?.logo_url) {
      try {
        const logoRes = await fetch(vendor.logo_url);
        if (logoRes.ok) {
          const blob = await logoRes.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(blob)));
          const contentType = logoRes.headers.get("content-type") || "image/png";
          logoDataUrl = `data:${contentType};base64,${base64}`;
        }
      } catch {
        // Logo fetch failed, proceed without
      }
    }

    // Generate HTML
    const html = generatePdfHtml(
      vendor as VendorBranding,
      logoDataUrl,
      quote,
      quote.request,
      quote.request.event,
      clientProfile,
      offerNumber
    );

    // Use Lovable AI gateway to convert HTML to clean text summary (not ideal but functional)
    // For proper PDF, we store the HTML and serve it as a downloadable document
    const htmlBytes = new TextEncoder().encode(html);
    const pdfKey = `offers/${quote_id}/${offerNumber}.html`;

    // Upload HTML as the "PDF" (will be rendered by the browser for download/print)
    const { error: uploadError } = await supabase.storage
      .from("quote-pdfs")
      .upload(pdfKey, htmlBytes, {
        contentType: "text/html",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Failed to store document" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update quote status and PDF fields
    const { error: updateError } = await supabase
      .from("quotes")
      .update({
        status: "client_accepted",
        offer_number: offerNumber,
        final_offer_pdf_key: pdfKey,
        final_offer_pdf_generated_at: new Date().toISOString(),
      })
      .eq("id", quote_id);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update quote" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decline other quotes for the same request
    await supabase
      .from("quotes")
      .update({ status: "client_declined" })
      .eq("request_id", quote.request_id)
      .neq("id", quote_id);

    return new Response(
      JSON.stringify({
        success: true,
        offer_number: offerNumber,
        pdf_key: pdfKey,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
