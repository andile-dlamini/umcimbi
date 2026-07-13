// Fire-and-forget invoker for notify-vendor-event. Never throws.
export async function fireNotifyVendorEvent(payload: Record<string, unknown>): Promise<void> {
  try {
    const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-vendor-event`;
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn("fireNotifyVendorEvent failed:", err);
  }
}
