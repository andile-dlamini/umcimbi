
## Goal

In `src/pages/admin/AdminOperations.tsx`, replace the "View" button on each disputed booking with a "Resolve" button that opens an inline form to release a configurable vendor payout, then mark the booking completed.

## Changes (scoped to AdminOperations.tsx only)

### 1. Data model
- Add `balance_amount: number` to the `DisputedBooking` interface.
- Add `balance_amount` to the disputes Supabase select string.

### 2. State
- Add `const [resolvingId, setResolvingId] = useState<string | null>(null)` — controls which row's inline form is open.
- Add `const [percentage, setPercentage] = useState<number>(100)` — vendor receives %.
- Add `const [submitting, setSubmitting] = useState(false)`.

### 3. UI per disputed booking
- Replace the existing `<Button>View</Button>` with `<Button>Resolve</Button>` that calls `setResolvingId(d.id); setPercentage(100);`.
- Below the row, when `resolvingId === d.id`, render an inline panel containing:
  - `<Input type="number" min=0 max=100>` labelled "Vendor receives (%)" bound to `percentage`.
  - Read-only display: `R {(d.balance_amount / 1.08 * percentage / 100).toFixed(2)}`.
  - "Confirm Resolution" button (disabled while `submitting`).
  - "Cancel" button → `setResolvingId(null)`.

### 4. Confirm handler
```ts
const calculated = Math.round((d.balance_amount / 1.08 * percentage / 100) * 100) / 100;

await supabase.functions.invoke('trigger-vendor-payout', {
  body: { booking_id: d.id, payout_type: 'balance', override_amount: calculated }
});

await supabase.from('bookings').update({
  booking_status: 'completed',
  funds_released_at: new Date().toISOString(),
}).eq('id', d.id);

toast.success('Resolution confirmed');
setDisputes(prev => prev.filter(x => x.id !== d.id));
setResolvingId(null);
```
Use `sonner`'s `toast`. On error, `toast.error(...)` and keep the row.

### 5. Imports to add
- `Input` from `@/components/ui/input`
- `Label` from `@/components/ui/label`
- `toast` from `sonner`

Nothing else in the file changes (other queues, layout, styles untouched).
