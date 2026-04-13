
## Plan: Fix the middle “Comparable quotes” icon with a real contrast fix

### What’s actually wrong
The previous tweak only increased the icon chip background. The real issue is the icon color token:
- `text-secondary` is using the pale `secondary` color
- in `src/index.css`, `--secondary` is `24 40% 92%`, which is almost the same brightness as the light section background
- so the BarChart3 icon still looks washed out even after changing `/15` to `/25`

### What I’ll change
In `src/pages/onboarding/OnboardingLanguage.tsx` (the 3-pillar config around lines 211–217), I’ll update the middle card to use:
- `iconColor: 'text-secondary-foreground'`
- `iconBg: 'bg-secondary border border-secondary-foreground/10 shadow-sm'`

I’ll also give the other two icon wrappers the same subtle border/shadow treatment so all three pillars stay visually consistent, without changing their brand colors.

### Result
The middle icon will use the readable foreground token instead of the pale tint token, and the chip will separate clearly from the light card background.

### File
- `src/pages/onboarding/OnboardingLanguage.tsx`
