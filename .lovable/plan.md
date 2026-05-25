I’ll make exactly one targeted change in `supabase/functions/send-waitlist-launch-emails/index.ts`:

1. Locate the internal `fetch` call to `send-transactional-email`.
2. Replace the two request headers:
   - `Authorization: Bearer ${anonKey}` → `Authorization: Bearer ${serviceKey}`
   - `apikey: anonKey` → `apikey: serviceKey`
3. Leave everything else unchanged.