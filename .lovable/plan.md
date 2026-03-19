

## Footer Update + Contact Page

### Footer Changes (`src/pages/onboarding/OnboardingLanguage.tsx`, lines 738-749)

Replace the placeholder logo + "UMCIMBI" text with `<img src="/images/umcimbi-logo.png" />`. Add 3 social icons (Instagram, Facebook, TikTok — no Twitter). Update "Contact" to link to `/contact`.

**Updated footer layout:**

```text
[UMCIMBI logo]     [IG] [FB] [TT]     © 2026 UMCIMBI · Privacy · Terms · Contact
```

- Instagram → https://instagram.com/umcimbi.official
- Facebook → https://facebook.com/umcimbi.official
- TikTok → https://tiktok.com/@umcimbi.official
- All open in new tabs (`target="_blank"`)

### Contact Page (`src/pages/contact/ContactPage.tsx`)

A simple, clean contact page accessible without login. Layout:

```text
┌──────────────────────────────────────────┐
│  [UMCIMBI logo]              [← Back]   │
│                                          │
│         📧  Get in Touch                 │
│                                          │
│   ┌──────────────────────────────────┐   │
│   │  Your Name          [________]   │   │
│   │  Your Email         [________]   │   │
│   │  Subject            [________]   │   │
│   │  Message            [________]   │   │
│   │                     [________]   │   │
│   │                                  │   │
│   │         [ Send Message ]         │   │
│   └──────────────────────────────────┘   │
│                                          │
│   Or email us directly:                  │
│   andile@umcimbi.co.za                   │
│                                          │
│   [IG] [FB] [TT]                         │
│   © 2026 UMCIMBI                         │
└──────────────────────────────────────────┘
```

- Styled with the same dark/warm theme as the onboarding page
- Form submits via `mailto:andile@umcimbi.co.za` (no backend needed)
- Direct email link shown below the form as an alternative
- Social icons repeated in mini footer
- Back button returns to `/onboarding`

### Routing (`src/App.tsx`)

Add `/contact` as a public route (accessible without auth), alongside `/onboarding` and `/auth`.

### Files

| File | Action |
|------|--------|
| `src/pages/onboarding/OnboardingLanguage.tsx` | Update footer: logo image, 3 social icons, Contact links to `/contact` |
| `src/pages/contact/ContactPage.tsx` | New — contact form page |
| `src/App.tsx` | Add `/contact` route in unauthenticated routes |

