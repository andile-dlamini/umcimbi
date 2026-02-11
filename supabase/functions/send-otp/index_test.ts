import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const BASE = `${SUPABASE_URL}/functions/v1/send-otp`;

async function callSendOtp(body: Record<string, unknown>, headers?: Record<string, string>) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      ...headers,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

// AUTH-HP-01: Send OTP to valid number
Deno.test("AUTH-HP-01: send OTP to valid E.164 number returns success", async () => {
  const { status, data } = await callSendOtp({ phone_number: "+27710000001" });
  assertEquals(status, 200);
  assertEquals(data.success, true);
});

// AUTH-EC-01: Leading zero normalization
Deno.test("AUTH-EC-01: send OTP with leading zero normalizes to +27", async () => {
  const { status, data } = await callSendOtp({ phone_number: "0710000002" });
  assertEquals(status, 200);
  assertEquals(data.success, true);
});

// AUTH-EC-02: Invalid phone number (too short)
Deno.test("AUTH-EC-02: send OTP to invalid number returns 400", async () => {
  const { status, data } = await callSendOtp({ phone_number: "+271234" });
  assertEquals(status, 400);
  assertExists(data.error);
});

// AUTH-EC-02b: Missing phone number
Deno.test("AUTH-EC-02b: send OTP without phone_number returns 400", async () => {
  const { status, data } = await callSendOtp({});
  assertEquals(status, 400);
  assertExists(data.error);
});

// Cleanup test OTP records
Deno.test("cleanup: remove test OTP records", async () => {
  if (!SERVICE_ROLE_KEY) return;
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  await supabase
    .from("otp_requests")
    .delete()
    .in("phone_number", ["+27710000001", "+27710000002"]);
});
