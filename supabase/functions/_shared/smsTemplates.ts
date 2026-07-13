// Shared SMS templates + Connect Mobile sender for UMCIMBI notifications.

export type SmsEvent =
  | "new_service_request"
  | "first_message_to_vendor"
  | "first_message_to_planner"
  | "quote_sent"
  | "quote_accepted"
  | "deposit_paid_vendor"
  | "deposit_confirmed_planner"
  | "balance_paid_vendor"
  | "delivery_uploaded"
  | "payout_released"
  | "dispute_raised_vendor"
  | "dispute_raised_planner"
  | "response_nudge"
  | "digest";

const T: Record<SmsEvent, (ctx: { name: string; count?: number }) => string> = {
  new_service_request: ({ name }) =>
    `Hi ${name}, you've got a new request on UMCIMBI. Please log into your UMCIMBI app for more details.`,
  first_message_to_vendor: ({ name }) =>
    `Hi ${name}, a planner messaged you on UMCIMBI. Please log into your UMCIMBI app for more details.`,
  first_message_to_planner: ({ name }) =>
    `Hi ${name}, a vendor messaged you on UMCIMBI. Please log into your UMCIMBI app for more details.`,
  quote_sent: ({ name }) =>
    `Hi ${name}, you've received a new quote on UMCIMBI. Please log into your UMCIMBI app for more details.`,
  quote_accepted: ({ name }) =>
    `Hi ${name}, your quote was accepted and the booking is confirmed. Please log into your UMCIMBI app for more details.`,
  deposit_paid_vendor: ({ name }) =>
    `Hi ${name}, the deposit for your booking has been paid. Please log into your UMCIMBI app for more details.`,
  deposit_confirmed_planner: ({ name }) =>
    `Hi ${name}, your deposit has been received and your booking is confirmed. Please log into your UMCIMBI app for more details.`,
  balance_paid_vendor: ({ name }) =>
    `Hi ${name}, the balance for your booking has been paid. Please log into your UMCIMBI app for more details.`,
  delivery_uploaded: ({ name }) =>
    `Hi ${name}, your vendor has uploaded proof of delivery. Please log into your UMCIMBI app for more details.`,
  payout_released: ({ name }) =>
    `Hi ${name}, your payment has been released to your account. Please log into your UMCIMBI app for more details.`,
  dispute_raised_vendor: ({ name }) =>
    `Hi ${name}, a dispute has been raised on one of your bookings. Please log into your UMCIMBI app for more details.`,
  dispute_raised_planner: ({ name }) =>
    `Hi ${name}, your dispute has been received and is under review. Please log into your UMCIMBI app for more details.`,
  response_nudge: ({ name }) =>
    `Hi ${name}, a request on UMCIMBI is still waiting on you. Please log into your UMCIMBI app for more details.`,
  digest: ({ name, count }) =>
    `Hi ${name}, you have ${count ?? 1} new update(s) on UMCIMBI. Please log into your UMCIMBI app for more details.`,
};

export function renderSms(event: SmsEvent, ctx: { name?: string | null; count?: number }): string {
  const first = (ctx.name ?? "").trim().split(/\s+/)[0] || "there";
  return T[event]({ name: first, count: ctx.count });
}

export function normalizeSaPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let n = String(raw).replace(/\s|-/g, "");
  if (n.startsWith("0")) n = "+27" + n.slice(1);
  if (!n.startsWith("+")) n = "+" + n;
  if (!/^\+27\d{9}$/.test(n)) return null;
  return n.replace("+", "");
}

export async function sendConnectMobileSms(
  phoneE164NoPlus: string,
  body: string,
  msgId: string,
): Promise<{ ok: boolean; status: number; response: string }> {
  const key = Deno.env.get("CONNECT_MOBILE_API_KEY");
  if (!key) throw new Error("CONNECT_MOBILE_API_KEY is not configured");
  const url = `https://sms.connect-mobile.co.za/submit/single/?da=${phoneE164NoPlus}&ud=${encodeURIComponent(body)}&id=${msgId}`;
  const res = await fetch(url, { method: "GET", headers: { Authorization: `Bearer ${key}` } });
  const text = (await res.text()).slice(0, 500);
  return { ok: res.ok && !/(error|invalid|failed|denied|unauthorized)/i.test(text), status: res.status, response: text };
}
