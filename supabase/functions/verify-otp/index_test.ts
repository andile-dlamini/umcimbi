import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const BASE = `${SUPABASE_URL}/functions/v1/verify-otp`;

const TEST_PHONE = "+27720099001";

async function callVerifyOtp(body: Record<string, unknown>) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

// Helper: hash OTP the same way the edge function does
async function hashOtp(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// AUTH-EC-03: Verify with wrong code
Deno.test("AUTH-EC-03: verify with wrong OTP returns error with attempts_remaining", async () => {
  if (!SERVICE_ROLE_KEY) return;

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Seed a valid OTP record
  const correctOtp = "123456";
  const otpHash = await hashOtp(correctOtp);
  await supabase.from("otp_requests").insert({
    phone_number: TEST_PHONE,
    otp_hash: otpHash,
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    attempt_count: 0,
    max_attempts: 5,
    send_count: 1,
    last_sent_at: new Date().toISOString(),
    verified: false,
  });

  const { status, data } = await callVerifyOtp({
    phone_number: TEST_PHONE,
    otp: "000000",
    first_name: "Test",
    surname: "User",
    address: "123 Test St",
    password: "testpass123",
  });

  assertEquals(status, 400);
  assertExists(data.error);
  assertExists(data.attempts_remaining);
  assertEquals(typeof data.attempts_remaining, "number");

  // Cleanup
  await supabase.from("otp_requests").delete().eq("phone_number", TEST_PHONE);
});

// AUTH-EC-04: Verify expired OTP
Deno.test("AUTH-EC-04: verify expired OTP returns expired error", async () => {
  if (!SERVICE_ROLE_KEY) return;

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const otpHash = await hashOtp("654321");
  await supabase.from("otp_requests").insert({
    phone_number: TEST_PHONE,
    otp_hash: otpHash,
    expires_at: new Date(Date.now() - 60 * 1000).toISOString(), // expired 1 min ago
    attempt_count: 0,
    max_attempts: 5,
    send_count: 1,
    last_sent_at: new Date().toISOString(),
    verified: false,
  });

  const { status, data } = await callVerifyOtp({
    phone_number: TEST_PHONE,
    otp: "654321",
    first_name: "Test",
    surname: "User",
    address: "123 Test St",
    password: "testpass123",
  });

  assertEquals(status, 400);
  assertEquals(data.expired, true);

  // Cleanup
  await supabase.from("otp_requests").delete().eq("phone_number", TEST_PHONE);
});

// AUTH-EC-05: Exceed max attempts
Deno.test("AUTH-EC-05: exceed max attempts returns locked", async () => {
  if (!SERVICE_ROLE_KEY) return;

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const otpHash = await hashOtp("111111");
  await supabase.from("otp_requests").insert({
    phone_number: TEST_PHONE,
    otp_hash: otpHash,
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    attempt_count: 5, // already at max
    max_attempts: 5,
    send_count: 1,
    last_sent_at: new Date().toISOString(),
    verified: false,
  });

  const { status, data } = await callVerifyOtp({
    phone_number: TEST_PHONE,
    otp: "111111",
    first_name: "Test",
    surname: "User",
    address: "123 Test St",
    password: "testpass123",
  });

  assertEquals(status, 429);
  assertEquals(data.locked, true);

  // Cleanup
  await supabase.from("otp_requests").delete().eq("phone_number", TEST_PHONE);
});

// Missing required fields
Deno.test("verify-otp: missing required fields returns 400", async () => {
  const { status, data } = await callVerifyOtp({
    phone_number: TEST_PHONE,
    otp: "123456",
    // missing first_name, surname, address, password
  });

  assertEquals(status, 400);
  assertExists(data.error);
});
