

## Unified Onboarding Wizard — Plan

### Overview
Replace the current split registration flow (AuthPage for account + separate VendorOnboarding page) with a single, continuous stepper wizard. The role choice (Planner vs Vendor) is the first screen. The stepper dynamically reveals steps based on the chosen role.

### Flow

```text
PLANNER PATH:                    VENDOR PATH:
┌─────────────┐                  ┌─────────────┐
│ 1. Role     │                  │ 1. Role     │
│    Choice   │                  │    Choice   │
├─────────────┤                  ├─────────────┤
│ 2. Personal │                  │ 2. Personal │
│    Details  │                  │    Details  │
├─────────────┤                  ├─────────────┤
│ 3. OTP      │                  │ 3. OTP      │
├─────────────┤                  ├─────────────┤
│ 4. Password │                  │ 4. Password │
├─────────────┤                  ├─────────────┤
│ 5. Success  │                  │ 5. Business │
└─────────────┘                  │    Details  │
                                 ├─────────────┤
                                 │ 6. Showcase │
                                 │    & Photos │
                                 ├─────────────┤
                                 │ 7. Success  │
                                 └─────────────┘
```

### Step Details

**Step 1 — Role Choice**
Two large tappable cards: "I'm planning a ceremony" (Planner) and "I'm a service provider" (Vendor). Each with an icon and short description. Selecting one reveals the stepper with the correct number of steps.

**Step 2 — Personal Details** (shared)
First name, Surname, Phone (SA +27 prefix), T&Cs checkbox. Same validation as current. Submits to `send-otp`.

**Step 3 — OTP Verification** (shared)
6-digit OTP input, resend with cooldown, 5-min expiry timer. Same as current.

**Step 4 — Set Password** (shared)
Password + confirm password. For planners, this submits to `verify-otp` (creates account) and shows success. For vendors, this creates the account and advances to step 5.

**Step 5 — Business Details** (vendor only)
Business name + logo upload, service category, business address (AddressFields component), phone, email, website, business type toggle (independent/registered), registration details if registered. Pulled from existing VendorOnboarding form.

**Step 6 — Showcase & Photos** (vendor only)
Up to 5 showcase images, verification documents if registered business. Pulled from existing VendorOnboarding. On submit, creates vendor profile, uploads images, assigns `vendor` role.

**Step 7 / Step 5 — Success**
Planner: "You're all set! Start planning your ceremony." → navigate to `/`.
Vendor: "Your business profile is live!" → navigate to vendor dashboard.

### Stepper UI
Horizontal progress bar matching the screenshot style: numbered circles connected by lines. Completed steps show a checkmark in a filled teal (#0D9488) circle. Current step has a teal outline. Future steps are grey. The stepper only appears after role selection (step 2+) and shows the correct total for the chosen path.

### Technical Changes

| File | Change |
|------|--------|
| `src/pages/auth/AuthPage.tsx` | Full rewrite to a unified stepper wizard containing all steps. Role state drives step count. Vendor steps 5-6 incorporate logic from VendorOnboarding (form state, image uploads, vendor creation). |
| `src/pages/vendors/VendorOnboarding.tsx` | Kept for the "Become a Vendor" path (existing planners upgrading). No changes needed. |
| `src/context/AuthContext.tsx` | No changes — role assignment happens via existing `user_roles` table insert in `verify-otp` or post-account-creation. |
| `supabase/functions/verify-otp/index.ts` | Minor update: accept an optional `role` field. If `role === 'vendor'`, insert a `vendor` role into `user_roles` after account creation. |
| Database migration | Add an INSERT policy on `user_roles` so the edge function (using service role) can insert roles — already handled by service role key, so no migration needed. |

### What stays the same
- Login flow (phone + password) — untouched
- Forgot password flow — untouched
- "Become a Vendor" path for existing users — untouched
- OTP security (SHA-256 hashing, rate limiting, expiry) — untouched
- Phone-to-shadow-email mapping — untouched

