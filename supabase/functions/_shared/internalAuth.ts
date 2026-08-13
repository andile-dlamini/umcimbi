// Shared internal-call authentication for functions invoked by DB triggers / cron.
//
// Trust model: these functions run with `verify_jwt = true` in supabase/config.toml,
// so the platform verifies the token's SIGNATURE before this code executes. Anything
// reaching us is a genuine, project-signed token.
//
// This helper then narrows that to internal callers only:
//   1. Exact match against SUPABASE_SERVICE_ROLE_KEY (the normal path).
//   2. Otherwise, a defence-in-depth claim check for `role: service_role`. This keeps
//      internal calls working when the vault copy of the key (`email_queue_service_role_key`)
//      drifts after a rotation — but it is only ever reached for tokens the platform has
//      already signature-verified. It is NEVER a standalone gate.
//
// Do not call this from a function with `verify_jwt = false`: without platform
// verification the claim check below is forgeable.

function readVerifiedClaims(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
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

  // Reached only behind platform signature verification (verify_jwt = true).
  const claims = readVerifiedClaims(token);
  return claims?.role === "service_role";
}
