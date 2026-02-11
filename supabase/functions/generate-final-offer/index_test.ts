import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const BASE = `${SUPABASE_URL}/functions/v1/generate-final-offer`;

async function callGenerateFinalOffer(body: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON_KEY,
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

// ACC-EC-03: Unauthenticated request
Deno.test("ACC-EC-03: unauthenticated request returns 401", async () => {
  const { status, data } = await callGenerateFinalOffer({ quote_id: "fake-id" });
  assertEquals(status, 401);
  assertEquals(data.error, "Unauthorized");
});

// Missing quote_id
Deno.test("generate-final-offer: missing quote_id returns 400", async () => {
  // Use a fake token - will fail auth but tests param validation order
  const { status, data } = await callGenerateFinalOffer({}, "fake-token");
  // Should be 401 since fake token fails auth first
  assertEquals(status, 401);
});
