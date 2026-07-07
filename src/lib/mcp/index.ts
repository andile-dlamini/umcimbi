import { auth, defineMcp } from "@lovable.dev/mcp-js";

// Build the Supabase Auth issuer from the project ref (Vite inlines this literal
// at build time, so the entry stays import-safe with no runtime env reads).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "umcimbi-mcp",
  title: "UMCIMBI",
  version: "0.1.0",
  instructions:
    "Tools for UMCIMBI, a South African traditional ceremony planning platform. " +
    "Use `whoami` to confirm identity, `list_my_events` and `list_my_bookings` to read the " +
    "signed-in planner's ceremonies and vendor bookings, and `search_vendors` to browse " +
    "the public vendor marketplace by category or free text.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [],
});
