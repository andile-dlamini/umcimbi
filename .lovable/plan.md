# Service region taxonomy — database only (step 1 of 4)

Add the KZN service-region taxonomy to the backend. Nothing in the app reads it yet.

## What gets created

- **service_regions** — 10 regions (Durban/eThekwini through Southern Inland/Harry Gwala), each with a code, display name and ordering.
- **service_areas** — 97 towns/townships linked to a region, each with optional alternative spellings (e.g. PMB for Pietermaritzburg).
- **vendor_service_regions** — records which regions each vendor serves.
- **events** gains a service area link, so a ceremony can point at the same taxonomy.

## Access rules

- Everyone, including logged-out visitors, can read the regions, areas, and which vendors serve which regions (so public browse can filter later).
- Only admins can add, edit, or remove regions and areas.
- A vendor can add or remove their own service regions; admins can manage any vendor's.

## Technical notes

- The SQL is applied exactly as supplied, in one migration file, unchanged: tables, indexes, the `events.service_area_id` column, RLS enablement, six policies, and both seed inserts.
- One deviation flagged for your call: the supplied SQL has no `GRANT` statements. Without grants to `anon`/`authenticated`/`service_role`, the Data API returns a permission error for these tables even though the policies allow reads — so when the app starts reading them in step 2, every query fails. Recommendation: apply your SQL verbatim now, then a second tiny migration adds the grants (`SELECT` to `anon` and `authenticated` on all three, `INSERT`/`DELETE` to `authenticated` on `vendor_service_regions`, `ALL` to `service_role`). Say the word if you'd rather fold the grants into the same file.
- No TypeScript, component, hook, page, or edge function is touched.
- After the migration runs, `src/integrations/supabase/types.ts` is regenerated automatically so the three tables and the new events column appear in types. It is not hand-edited.

## Verification

- Confirm 10 rows in `service_regions` and 97 in `service_areas`.
- Confirm `events.service_area_id` exists and is nullable.
- Confirm the regenerated types file contains the three new tables.
