## Plan

### 1. New migration: tighten `payment-proofs` storage policies
Create a new migration file dropping the two existing permissive policies and replacing them with owner-scoped INSERT (client of the booking) and SELECT (client, vendor owner, or admin) policies keyed off the booking ID embedded in the object path.

### 2. New migration: tighten `vendor-images` storage policies
Create a second migration file dropping the three any-authenticated-user policies and replacing them with INSERT/UPDATE/DELETE policies that require the path's first folder to match a vendor ID owned by `auth.uid()`.

### 3. Edit `supabase/functions/generate-order-confirmation/index.ts`
Add a service-role bearer token check at the top of `Deno.serve`. Requests without `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` get a 401. Existing logic continues unchanged.

### 4. Edit `supabase/functions/admin-daily-brief/index.ts`
Replace the comment-only auth block with explicit token validation:
- Accept service-role JWT (cron path), OR
- Validate user JWT via `auth.getUser` and confirm the user has the `admin` role in `user_roles`.
- Otherwise return 401/403.

### ⚠️ Issue to flag in the provided snippet
The replacement block for `admin-daily-brief` ends with:
```ts
try {
  const supabaseUrl = supabaseUrl;
  const supabaseServiceKey = serviceKey;
```
`const supabaseUrl = supabaseUrl;` self-references inside the same declaration (TDZ ReferenceError at runtime). I will fix this by **omitting** the inner `const supabaseUrl` redeclaration (the outer one is already in scope inside the `try`). Everything else in the snippet is applied verbatim.

If you'd prefer it copied exactly as written (which will crash the function), say so and I'll do that instead.

### Files touched
- `supabase/migrations/<new>_fix_payment_proofs_storage_policies.sql` (new)
- `supabase/migrations/<new>_fix_vendor_images_storage_policies.sql` (new)
- `supabase/functions/generate-order-confirmation/index.ts`
- `supabase/functions/admin-daily-brief/index.ts`

No other files will be modified.
