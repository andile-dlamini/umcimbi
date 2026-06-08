## Rewrite `src/pages/admin/VendorVerificationQueue.tsx`

Single-file replacement. No new components, no other files touched.

### Data
- Fetch vendors where `is_active = false AND is_demo = false AND is_banned = false`, ordered `created_at` ASC, with all the specified columns.
- Fetch `vendor_verification_documents` for the returned vendor IDs and group by `vendor_id`.

### Local state
- `vendors` (list)
- `docs` (map vendor_id → docs[])
- `signedSelfies` (map vendor_id → signed URL) — resolved on load via `storage.from('vendor-selfies').createSignedUrl(path, 300)`
- `notesDraft` (map vendor_id → string) for textarea binding
- `checklist` (map vendor_id → 4 booleans) — local visual aid only
- `confirmReject` (vendor_id | null) for the reject dialog
- `loading`

### Card sections per vendor
- **A — Identity**: large name, category badge, phone, relative `created_at` (date-fns `formatDistanceToNow`), Registered/Informal badge, reg/VAT numbers when registered.
- **B — Profile preview**: logo from `image_urls[0]`, 4 thumbnails from `image_urls[1..4]`, full `about`, location, social icons (Instagram/TikTok/Facebook from lucide-react; only render when URL set, `target="_blank" rel="noreferrer"`), website link.
- **C — Bank details**: render fields; mask account number to `••••` + last 4; "No bank details submitted" when all null.
- **D — Documents**: list with doc_type humanized label + "View Document" link in new tab; "No documents submitted" fallback.
- **E — Selfie**: signed image / "requested … awaiting submission" / "No selfie submitted". `Request Selfie` button generates `crypto.randomUUID()`, updates vendor (`selfie_request_token`, `selfie_request_sent_at = now()`), then fires `send-vendor-status-sms` twice: `request_selfie`, then `selfie_link` with `notes = ${window.location.origin}/verify/selfie?token=${token}`. Toast + refetch.
- **F — Checklist**: 4 controlled checkboxes from shadcn `Checkbox`, local state only.
- **G — Notes**: `Textarea` bound to `notesDraft[vendor.id]`, on blur if changed → `update vendors set admin_approval_notes = value where id = vendor.id`.
- **H — Action buttons** (4):
  1. Approve & Activate (green): `is_active = true`, invoke SMS `approved`, fire-and-forget `rpc('calculate_vendor_trust_score', { p_vendor_id })`, remove from list.
  2. Verify Business (blue, hidden if already `verified`): set `business_verification_status='verified'`, `verification_reviewed_at = now()`, `verification_reviewed_by = user.id`; keep in list, refresh.
  3. Request More Info (amber): require non-empty notes; invoke SMS `request_info` with notes; toast.
  4. Reject (red outline): opens AlertDialog with two actions:
     - Reject — can resubmit: `business_verification_status='rejected'`, SMS `rejected` w/ notes, remove from list.
     - Permanent ban: `business_verification_status='rejected'`, `is_banned=true`, SMS `banned`, remove from list.

### Page header
`PageHeader` title `"Vendor Approval Queue"` + count `Badge` showing `vendors.length`.

### Empty state
"All vendors reviewed — queue is clear 🎉" when `!loading && vendors.length === 0`.

### Imports
shadcn `Card`, `Button`, `Badge`, `Textarea`, `Checkbox`, `AlertDialog*`; lucide icons (`Instagram`, `Music2` for TikTok, `Facebook`, `Globe`, `Phone`, `MapPin`, `FileText`, `CheckCircle`, `BadgeCheck`, `AlertCircle`, `XCircle`, `Camera`); `date-fns/formatDistanceToNow`; `toast` from sonner; `supabase` client; `useAuth`; `PageHeader`.

### Out of scope
- No new component files
- No migrations
- No vendor-facing changes
- No edits to other admin pages