

## Vendor Badges and Differentiation Feature

### Overview

This feature adds three layers of vendor differentiation:
- **Business Type** (Independent vs Registered Business) -- chosen during onboarding
- **Verified Business badge** (blue check) -- earned through admin document review
- **Super Vendor badge** (star) -- earned through performance or admin grant

---

### Phase 1: Database Schema Changes

**Add columns to `vendors` table:**

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| vendor_business_type | ENUM('independent', 'registered_business') | 'independent' | Required |
| business_verification_status | ENUM('not_applicable', 'pending', 'verified', 'rejected') | 'not_applicable' | Auto-set based on type |
| registered_business_name | text | null | Only for registered businesses |
| registration_number | text | null | Only for registered businesses |
| vat_number | text | null | Optional |
| is_super_vendor | boolean | false | |
| super_vendor_awarded_at | timestamptz | null | |
| super_vendor_reason | text | null | Admin audit trail |
| verification_reviewed_at | timestamptz | null | |
| verification_reviewed_by | uuid | null | Admin user ID |

**New table: `vendor_verification_documents`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| vendor_id | uuid FK -> vendors | |
| doc_type | ENUM('cipc_registration', 'proof_of_address', 'bank_confirmation', 'vat_certificate', 'other') | |
| file_url | text | Stored in vendor-images bucket |
| status | ENUM('uploaded', 'approved', 'rejected') | Default 'uploaded' |
| notes | text | Admin review notes |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**RLS policies for `vendor_verification_documents`:**
- Vendors can INSERT/SELECT their own documents (matched via vendor owner_user_id)
- Admins can SELECT/UPDATE all documents (for review workflow)

**New storage path:** Documents uploaded to `vendor-images` bucket under `{vendor_id}/docs/` path.

---

### Phase 2: Vendor Onboarding Changes

Update `VendorOnboarding.tsx` to add a **"Business Type"** step after the category selection:

- Radio/toggle: "Are you a formally registered business?"
  - **Yes** -> Show extra fields: registered business name, registration number, optional VAT number, document upload area (CIPC registration + proof of address). Set `vendor_business_type = 'registered_business'` and `business_verification_status = 'pending'`. Show info message about review process.
  - **No** -> Skip all business docs. Set `vendor_business_type = 'independent'` and `business_verification_status = 'not_applicable'`. Show encouraging message about Super Vendor badge.

---

### Phase 3: Badge Components

Create a reusable `VendorBadges` component (`src/components/vendors/VendorBadges.tsx`):
- Renders a blue check "Verified" badge when `business_verification_status = 'verified'`
- Renders a gold star "Super Vendor" badge when `is_super_vendor = true`
- Badges stack horizontally
- Used on: VendorCard, VendorDetail, VendorProfile

---

### Phase 4: UI Integration

**VendorCard** (`src/components/shared/VendorCard.tsx`):
- Add `VendorBadges` next to the vendor name

**VendorDetail** (`src/pages/vendors/VendorDetail.tsx`):
- Add `VendorBadges` next to the vendor name/logo area
- Show verification status privately if vendor is viewing their own profile (pending/rejected)

**VendorProfile** (`src/pages/profile/VendorProfile.tsx`):
- Show current business type and verification status
- If rejected: show admin notes privately
- If pending: show "Under review" status

---

### Phase 5: Search Filters and Sorting

**VendorsList** (`src/pages/vendors/VendorsList.tsx`):
- Add filter toggles: "Verified only" and "Super Vendors only"
- Pass filters to the query hook

**useVendors / useVendorsWithDistance hooks**:
- Add filter parameters for `business_verification_status = 'verified'` and `is_super_vendor = true`
- Add sorting boost: Super Vendors first, then Verified, then others (with rating as primary driver)

---

### Phase 6: Admin Tools

**New page: `src/pages/admin/VendorVerificationQueue.tsx`**
- Lists vendors with `business_verification_status = 'pending'`
- Shows uploaded documents with links to view
- Approve button -> sets status to 'verified', captures reviewed_by and reviewed_at
- Reject button -> sets status to 'rejected' with admin notes field

**New page: `src/pages/admin/SuperVendorManagement.tsx`**
- Lists all active vendors with toggle for is_super_vendor
- Reason text field required when toggling
- Timestamps auto-captured

**AdminDashboard** (`src/pages/admin/AdminDashboard.tsx`):
- Add navigation buttons to both new admin pages

**App.tsx routes:**
- Add `/admin/verification-queue` and `/admin/super-vendors` routes

---

### Phase 7: Type Updates

Update `src/types/database.ts`:
- Add new enum types for business type, verification status, and doc type
- Extend the `Vendor` interface with the new columns
- Add `VendorVerificationDocument` interface

---

### Privacy and Security

- Registration numbers and documents are NEVER shown publicly
- Only the badge icon is visible to other users
- Documents accessible only to the vendor owner and admins (enforced via RLS)
- Admin actions require the `admin` role via `has_role()` function

---

### Technical Notes

- The auto-award Super Vendor logic is structured for future implementation but starts as manual-only (no nightly job needed yet since booking/review metrics are limited)
- Existing vendors will default to `vendor_business_type = 'independent'` and `business_verification_status = 'not_applicable'`, so no existing data is disrupted
- The `vendor-images` bucket is already public for images, but verification documents will be stored under a `/docs/` subfolder -- consider adding RLS on storage.objects to restrict doc access to owner + admins

