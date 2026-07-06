import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: ctx.isAuthenticated()
      ? { headers: { Authorization: `Bearer ${ctx.getToken()}` } }
      : undefined,
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "search_vendors",
  title: "Search vendors",
  description: "Search active Umcimbi vendors by category and/or free-text query. Returns public vendor info only.",
  inputSchema: {
    category: z.string().optional().describe("Vendor category slug, e.g. 'catering', 'photography'."),
    query: z.string().optional().describe("Free-text match against business name or description."),
    limit: z.number().int().min(1).max(50).optional().describe("Max results (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ category, query, limit }, ctx) => {
    let q = supabaseForUser(ctx)
      .from("vendors_public")
      .select("id, business_name, category, description, city, province, rating, review_count, is_verified")
      .limit(limit ?? 20);
    if (category) q = q.eq("category", category);
    if (query) q = q.or(`business_name.ilike.%${query}%,description.ilike.%${query}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { vendors: data ?? [] },
    };
  },
});
