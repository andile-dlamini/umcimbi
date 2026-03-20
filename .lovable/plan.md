

## Auto Super Vendor: 20+ Jobs & 4.8+ Rating

### How It Works

Vendors automatically earn (or lose) Super Vendor status based on lifetime metrics:
- **20+ completed bookings** (`jobs_completed >= 20`)
- **4.8+ average rating** (`rating >= 4.8`)

This runs as a database trigger — no admin action needed. Similar to Airbnb's Superhost model.

### Changes

| File / Asset | Action |
|---|---|
| **DB migration** | Create trigger function `evaluate_super_vendor()` that runs after `jobs_completed` or `rating` changes on the `vendors` table |
| `src/pages/admin/SuperVendorManagement.tsx` | Refactor: remove manual toggle, show auto-eligibility status and current metrics instead (read-only view) |
| `src/components/vendors/VendorBadges.tsx` | Add tooltips (from prior approved plan) |
| `src/lib/umcimbiScore.ts` | Export the threshold constants for reuse |

### Database Trigger

```sql
CREATE OR REPLACE FUNCTION evaluate_super_vendor()
RETURNS trigger AS $$
BEGIN
  IF NEW.jobs_completed >= 20 AND NEW.rating >= 4.8 THEN
    NEW.is_super_vendor := true;
    IF OLD.is_super_vendor = false THEN
      NEW.super_vendor_awarded_at := now();
      NEW.super_vendor_reason := 'Auto-awarded: 20+ jobs, 4.8+ rating';
    END IF;
  ELSE
    NEW.is_super_vendor := false;
    NEW.super_vendor_awarded_at := null;
    NEW.super_vendor_reason := null;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_evaluate_super_vendor
  BEFORE UPDATE OF jobs_completed, rating ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION evaluate_super_vendor();
```

### Admin Page Refactor

Replace the manual toggle with a read-only dashboard showing each vendor's:
- Current rating and jobs completed
- Whether they meet both thresholds (✓/✗)
- Current Super Vendor status and when it was awarded
- Sorted: Super Vendors first, then by closest to qualifying

### Tooltip Content (VendorBadges)

- **Verified** ✓: "Verified – UMCIMBI has verified this vendor's company registration documents"
- **Super Vendor** ★: "Super Vendor – Awarded automatically for completing 20+ jobs with a 4.8+ rating"

