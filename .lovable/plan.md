Three small edits to `supabase/functions/ozow-webhook/index.ts`:

1. Add `CurrencyCode` to the destructured body fields.
2. Insert `CurrencyCode || ""` between `Optional5 || ""` and `IsTest || ""` in the `hashFields` array.
3. Update hash comparison to strip leading zeros on both sides:
   `expectedHash.toLowerCase().replace(/^0+/, "") !== (Hash || "").toLowerCase().replace(/^0+/, "")`

No other files or logic touched.