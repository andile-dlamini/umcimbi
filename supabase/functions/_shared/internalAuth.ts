// Shared internal-call authentication for functions invoked by DB triggers / cron.
//
// Why not a plain string comparison against SUPABASE_SERVICE_ROLE_KEY?
// Triggers and cron jobs send the key stored in vault (`email_queue_service_role_key`).
// Whenever the project's service role key is rotated, that vault copy drifts and every
// internal call starts returning 401 silently. Accepting any token that carries the
// `service_role` claim (same trust model as process-email-queue) keeps internal calls
// working across rotations, while still rejecting anon/user tokens.

function parseJwtClaims(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function isInternalCall(req: Request): boolean {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;

  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (serviceRole && token === serviceRole) return true;

  const claims = parseJwtClaims(token);
  return claims?.role === "service_role";
}
