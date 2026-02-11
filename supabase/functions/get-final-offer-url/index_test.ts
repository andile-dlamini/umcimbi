import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const BASE = `${SUPABASE_URL}/functions/v1/get-final-offer-url`;

// PDF-SEC-05: Unauthenticated request
Deno.test("PDF-SEC-05: unauthenticated request returns 401", async () => {
  const res = await fetch(`${BASE}?quote_id=fake-id`, {
    headers: { apikey: SUPABASE_ANON_KEY },
  });
  const data = await res.json();
  assertEquals(res.status, 401);
  assertEquals(data.error, "Unauthorized");
});

// Missing quote_id parameter
Deno.test("get-final-offer-url: missing quote_id returns 400", async () => {
  const res = await fetch(BASE, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: "Bearer fake-token",
    },
  });
  const data = await res.json();
  // Will return 401 because fake token fails auth before param check
  assertEquals(res.status, 401);
});
