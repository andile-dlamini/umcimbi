
## Plan: Track Ndabe referrals across waitlist & vendor signups

### 1. `src/pages/WaitlistPage.tsx` — capture `?ref=` param
- Add `useSearchParams` to the `react-router-dom` import.
- After existing hooks: `const [searchParams] = useSearchParams();` and `const refSource = searchParams.get('ref');`
- In `handleSubmit`, change `source: 'waitlist_page'` → `source: refSource || 'waitlist_page'`.

### 2. `src/pages/admin/AdminWaitlist.tsx` — surface Ndabe data

**a. Imports**
- Add `Handshake` from `lucide-react`.

**b. State**
- `const [sourceFilter, setSourceFilter] = useState<string | null>(null);`
- `const [ndabeVendors, setNdabeVendors] = useState<number>(0);`
- Compute `const ndabeCount = entries.filter(e => e.source === 'ndabe').length;`

**c. Stat cards row**
- Change grid from `grid-cols-3` → `grid-cols-4`.
- Add 4th card "Via Ndabe" with `Handshake` icon (text-yellow-600), value `ndabeCount`, clickable to toggle `sourceFilter` between `'ndabe'` and `null`. Apply `ring-2 ring-primary` when active.

**d. Filter logic**
- Add `const matchesSource = !sourceFilter || e.source === sourceFilter;` and include in the `.filter()` chain.

**e. Table source column**
- When `entry.source === 'ndabe'`, render outlined Badge "Ndabe" (yellow-600 styling). Otherwise existing muted text.

**f. Vendor Registrations section (below table Card)**
- Extend the existing `useEffect` to also query:
  ```ts
  const { count } = await supabase
    .from('vendors')
    .select('*', { count: 'exact', head: true })
    .eq('signup_source', 'ndabe');
  if (count !== null) setNdabeVendors(count);
  ```
- Render new `<Card>`:
  - Title: "Vendor Registrations via Ndabe"
  - Description: explains `/join/vendor?ref=ndabe` direct registration path
  - Body: large `{ndabeVendors}` with subtitle "registered vendors attributed to Ndabe"

### Files changed
| File | Action |
|------|--------|
| `src/pages/WaitlistPage.tsx` | Edit (3 small changes) |
| `src/pages/admin/AdminWaitlist.tsx` | Edit (add card, filter, badge, section) |

### Not touched
App.tsx, AuthPage.tsx, AdminDashboard.tsx, AdminSidebar.tsx, AdminLayout.tsx, schema/migrations, any other files. Both `source` and `signup_source` columns already exist.
