

## Plan: Standardise ceremony list to 7 supported types across all UI

### Summary
Remove `funeral` and `family_introduction` from all UI surfaces. Keep them in the database schema (`supabase/types.ts`, enum). Update 5 files.

### Changes

**1. `src/types/database.ts`**
- Remove `funeral` and `family_introduction` from `EventType` union (line 4) — keep only the 7 supported types
- Remove those two entries from `EVENT_TYPES` array (lines 233-234, 240)
- Update remaining entries with the exact labels/descriptions specified
- Reorder: lobola, umembeso, umbondo, umabo, umemulo, imbeleko, ancestral_ritual

**2. `src/pages/events/CreateEvent.tsx`**
- Remove `family_introduction` and `funeral` from `colorMap` (lines 42, 48)
- The ceremony grid (line 150) already iterates `EVENT_TYPES`, so it will automatically show only the 7

**3. `src/components/shared/CeremonyJourney.tsx`**
- Remove `family_introduction` from `MARRIAGE_JOURNEY` (line 19) — journey becomes: lobola → umembeso → umbondo → umabo
- Remove `family_introduction` from `iconMap` (line 38)

**4. `src/pages/Home.tsx`**
- Replace `CEREMONY_TILES` array (lines 17-26) with exactly the 7 supported types in specified order, removing `family_introduction`
- Change the filter on line 79 from `e.type !== 'funeral'` to a whitelist: only show events whose type is in the 7 supported types

**5. `src/pages/onboarding/OnboardingLanguage.tsx`**
- In the "Also supporting" pills (lines 662-667): remove "Family Introduction" and "Funeral" entries, keep only Lobola, Imbeleko, Ancestral Ritual

### Files NOT changed
- `src/integrations/supabase/types.ts` (auto-generated)
- Database schema/migrations
- `src/data/learnArticles.ts` (articles can remain for existing records)
- Test files (will need separate updates)

