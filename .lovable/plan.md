

## Plan: Redesign Planner Home Screen

Six files changed. No hooks, types, or data files modified. Vendor sidebar/dashboard untouched.

### File 1: `index.html`
Add Google Fonts preconnect and stylesheet links for Fraunces + Nunito inside `<head>`, before existing content.

### File 2: `tailwind.config.ts`
Replace `fontFamily` section (line 81-83) with Nunito as sans, Fraunces as display.

### File 3: `src/index.css`
- Add `h1, h2 { font-family: 'Fraunces', Georgia, serif; font-optical-sizing: auto; }` inside `@layer base` block
- Update body font-family from Inter to Nunito (line 161)

### File 4: `src/components/layout/AppSidebar.tsx`
Conditionally style sidebar for planner role (when `activeRole !== 'vendor'`):
- Desktop wrapper: `bg-white border-r border-border` instead of dark sidebar colors
- Logo block: no invert/filter for planner
- User card: light colors, avatar with muted background, "Planner" sub-label
- Nav items: light color scheme — inactive: `text-foreground/55`, active: `text-accent bg-accent/8 border-l-2 border-accent`
- Bottom items: light destructive for logout
- Vendor sidebar remains completely unchanged (dark indigo)

### File 5: `src/pages/Home.tsx`
Full JSX redesign keeping all hooks, logic, imports, and NextEventHeroCard:
- **Topbar**: `h-[108px]` with greeting heading (font-display), subtitle, and "New Ceremony" button (hidden on mobile)
- **Content wrapper**: `max-w-5xl mx-auto px-6 py-8 space-y-8`
- **CeremonyJourney**: always shown, wrapped in a Card
- **Ceremony tiles**: always shown as 2x4 grid (lg:grid-cols-4), with sand-colored icon circles, "Browse vendors →" link
- **Has events**: NextEventHeroCard + moreUpcoming list rendered ABOVE ceremony tiles; tiles heading changes to "Plan another ceremony"
- **No events**: journey card + ceremony tiles only, heading "Choose a ceremony to plan"
- **Loading state**: centered Loader2 spinner
- **Removed**: stat pills block entirely

### File 6: `src/components/shared/CeremonyJourney.tsx`
Visual-only changes, all logic preserved:
- Header: simplified with "Your Journey" heading and "What's this? →" link
- Remove subtitle paragraph
- Circles: all use `bg-secondary` (sand) base; completed gets `bg-accent text-white` with Check icon; current gets `ring-2 ring-accent`; upcoming stays `bg-secondary opacity-50`
- "Next →" badge: `text-accent font-semibold`
- Connecting lines: completed-to-completed `bg-accent/50`, otherwise `bg-border`

### Technical Details
- Planner vs vendor distinction uses existing `activeRole` from `useRole()` context
- All sidebar conditional styling uses ternary on `isPlanner = activeRole !== 'vendor'` boolean
- No color tokens changed in index.css
- Mobile sidebar layout unchanged (icon rail stays as-is, conditionally styled)

