

## Plan: Fix Low-Contrast Icon in Middle "Why UMCIMBI" Pillar

### Problem
The middle pillar card ("Comparable quotes") uses `bg-secondary/15` for the icon background and `text-secondary` for the icon color. The secondary (terracotta) tone at 15% opacity creates very low contrast against the light background, making the BarChart3 icon hard to see.

### Fix
In `src/pages/onboarding/OnboardingLanguage.tsx`, line 212, increase the icon background opacity and ensure all three pillar cards have equally readable icons:

| Card | Current `iconBg` | New `iconBg` | `iconColor` (unchanged) |
|------|------------------|--------------|------------------------|
| Trusted vendors | `bg-primary/15` | `bg-primary/15` | `text-primary` |
| Comparable quotes | `bg-secondary/15` | `bg-secondary/25` | `text-secondary` |
| One organised plan | `bg-accent/15` | `bg-accent/25` | `text-accent` |

Bumping the middle and third cards from `/15` to `/25` gives the icon backgrounds enough tint to make the icons clearly visible, while keeping the subtle style consistent across all three.

### Files Changed
| File | Change |
|------|--------|
| `src/pages/onboarding/OnboardingLanguage.tsx` | Lines 212-213: change `bg-secondary/15` → `bg-secondary/25` and `bg-accent/15` → `bg-accent/25` |

