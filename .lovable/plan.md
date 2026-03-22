

## Plan: Rebuild Home Screen + Integrate Learn Content

### Summary
Three files to modify, no new files needed.

---

### 1. Rebuild `src/pages/Home.tsx` — Full Home Screen

Replace the redirect-only component with a proper home screen.

**Vendor role**: Keep `<Navigate to="/vendor-dashboard" />` as-is.

**Organiser role** — three states:

**STATE 1 — No events** (`events.length === 0`):
- Greeting: "Sawubona, [first_name]" with subtitle "What are you planning?"
- 2-column grid of 8 ceremony tiles (excludes funeral). Each tile shows icon + English name + isiZulu name in muted text. Clicking navigates to `/events/new?type=[type]`
- Tiles: umembeso/Gift, umabo/Heart, umemulo/Sparkles, imbeleko/Baby, lobola/Handshake, family_introduction/Users, umbondo/Package, ancestral_ritual/Flame
- Secondary link: "Not sure? Browse vendors first" → `/vendors`

**STATE 2 — Has upcoming events**:
- Greeting header
- Hero card for next upcoming event (sorted by date, first with date ≥ today, excluding funeral): shows ceremony badge + icon, event name, "X days away" countdown (date-fns `differenceInDays`), task progress bar (`useTasks(eventId).getProgress()`), "View Event" button
- Quick Actions row: "Find Vendors" → `/vendors`, "My Chats" → `/chats`, "My Events" → `/events`
- Up to 2 more upcoming events in a compact list (excluding funeral)

**STATE 3 — All events in past**:
- Same layout as STATE 2 but hero card replaced with "Plan your next ceremony" prompt: "Your ceremonies are complete. Ready to plan the next one?" + "Start Planning" button → `/events/new`

**Hooks**: `useAuth`, `useRole`, `useEvents`, `useTasks`

**Styling**: mobile-first, `max-w-lg mx-auto`, `px-4`, existing Card components, matches EventDashboard styling

---

### 2. Add "What is this ceremony?" card in `src/pages/events/CreateEvent.tsx`

After `handleTypeSelect` is called (step transitions to 2):
- Import `learnArticles` and `BookOpen`, `ChevronDown`, `ChevronUp` from lucide
- Add `infoExpanded` state
- In Step 2, before the form fields, render a collapsible Card if a matching article exists (`article.eventTypeId === eventType`)
- Header: BookOpen icon + "What is [shortLabel]?" + chevron toggle
- Collapsed by default; when expanded shows `article.sections[0].body`
- "Read full guide →" link to `/learn/[article.id]`

---

### 3. Add "Guide" tab to `src/pages/events/EventDashboard.tsx`

- Import `learnArticles` from `@/data/learnArticles` and `BookOpen` from lucide
- Find matching guide: `learnArticles.find(a => a.eventTypeId === event.type)`
- If guide exists, add a 4th tab trigger ("Guide" with BookOpen icon) after "Vendors"
- Tab content: render article title, subtitle, all sections inline (same pattern as ArticleDetail — heading, body, bullet items)
- Bottom quick links: "Find vendors" → `/vendors`, "View my tasks" → `setActiveTab('tasks')`

**Note**: Learn is not currently in the sidebar nav, so no removal needed there (CHANGE 1 from the request is already satisfied).

---

### Technical Details

| File | Action |
|------|--------|
| `src/pages/Home.tsx` | Full rewrite (~200 lines) |
| `src/pages/events/CreateEvent.tsx` | Add collapsible info card in step 2 (~30 lines) |
| `src/pages/events/EventDashboard.tsx` | Add Guide tab trigger + content (~50 lines) |

No database changes. No new dependencies (date-fns already imported in EventDashboard).

