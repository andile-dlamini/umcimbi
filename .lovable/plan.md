

## Plan: Add 4 Automated Test Files

Following the existing test pattern (inline test components, no actual component imports, using `renderWithProviders` from `test-utils.tsx`).

---

### Test File 1: `tests/Home.test.tsx`

Define an inline `Home` component that replicates the core logic of `src/pages/Home.tsx`:
- Accepts props: `profile`, `activeRole`, `isVendor`, `events`, `isLoading`, `getProgress`
- Renders the three organiser states + vendor redirect
- 5 test cases as specified: no events greeting, tile navigation, upcoming event card, vendor redirect, null first_name fallback

### Test File 2: `tests/VendorDetail.test.tsx`

Define an inline `VendorContactActions` component that mirrors the contact section:
- Accepts vendor props (name, phone_number, whatsapp_number, etc.)
- Renders Call button when phone exists, Start Chat button, NO WhatsApp button
- 3 test cases: no WhatsApp button, Call button present, Start Chat present

### Test File 3: `tests/LearnIntegration.test.tsx`

Define an inline `CeremonyGuideCard` component replicating the collapsible card from CreateEvent step 2:
- Uses Collapsible, shows "What is X?" header, body text on expand, "Read full guide" link
- 4 test cases: card appears, collapsed by default, expands on click, no card when no article

### Test File 4: `tests/AuthGoogle.test.tsx`

Define an inline `AuthLoginScreen` component replicating the login screen's Google button + divider + phone input:
- 3 test cases: Google button rendered, signInWithOAuth called on click, phone input + divider present

---

### Technical Details

| File | Approach |
|------|----------|
| `tests/Home.test.tsx` | Inline component with props for role/events/profile |
| `tests/VendorDetail.test.tsx` | Inline component with vendor contact props |
| `tests/LearnIntegration.test.tsx` | Inline component using actual Collapsible from ui |
| `tests/AuthGoogle.test.tsx` | Inline component with mock signInWithOAuth callback |

All files use `describe/it/expect/vi` from vitest, `renderWithProviders` from `./test-utils`, `screen/fireEvent` from testing library. No existing test files modified.

