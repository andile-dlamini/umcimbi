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

- The SQL is applied exactly as supplied, in one migration file, unchanged: tables, indexes, the `events.service_area_id` column, RLS enablement, six policies, both seed inserts, and the appended GRANT block.
- No TypeScript, component, hook, page, or edge function is touched.
- After the migration runs, `src/integrations/supabase/types.ts` is regenerated automatically so the three tables and the new events column appear in types. It is not hand-edited.

## Verification

- Confirm 10 rows in `service_regions` and 97 in `service_areas`.
- Confirm `events.service_area_id` exists and is nullable.
- Confirm the regenerated types file contains the three new tables.
