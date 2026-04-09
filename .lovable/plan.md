

## Plan: Add Payout Details Section to Vendor Profile

### 1. Database Migration
Add 6 new columns to `vendors` table: `payout_method`, `bank_name`, `bank_account_holder_name`, `bank_account_number`, `bank_branch_code`, `bank_account_type`.

### 2. New Component: `src/components/vendors/PayoutDetailsSection.tsx`
A self-contained Card component following the BrandingSection pattern:
- Props: `vendor`, `onUpdate` (same signature as BrandingSection)
- Internal `isEditing`/`isSaving`/`formData` state
- **View mode**: Shows masked account number (last 4 digits), bank name, account type, branch code, holder name. Green "✓ Payout ready" badge when complete. "Add bank details" prompt when empty.
- **Edit mode**: Bank dropdown (9 SA banks + "Other"), auto-fills branch code on selection. Account holder input, account number input, account type select (Current/Cheque, Savings, Transmission), editable branch code field. Amber info box about security. Save/Cancel buttons.
- Uses `Banknote` icon from lucide-react

### 3. VendorProfile.tsx
Add `<PayoutDetailsSection vendor={vendor} onUpdate={updateVendorProfile} />` between `BrandingSection` and the delete `AlertDialog` (line ~250). Import the new component.

### Files Changed
| File | Action |
|------|--------|
| Migration | Add 6 columns to vendors |
| `src/components/vendors/PayoutDetailsSection.tsx` | Create |
| `src/pages/profile/VendorProfile.tsx` | Add import + component |

### What Will NOT Change
BrandingSection, useVendors, booking/payment/escrow logic, any other pages.

