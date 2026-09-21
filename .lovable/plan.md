# Phase 1: Careers landing section + static careers page

Frontend-only. No database, no edge functions. Three files touched, one file created.

## 1. Landing page section — `src/pages/onboarding/OnboardingLanguage.tsx`

Insert a new dark-band `<section id="careers">` directly after the FAQ section's closing tag and before the `{/* ═══ FOOTER ═══ */}` comment, styled like the existing FAQ band (dark background, `scroll-mt-20` so the fixed header doesn't cover it):

- Eyebrow: "Careers" (uppercase tracking, accent colour)
- Heading: "Help us grow UMCIMBI on the ground"
- Body: "We're looking for a driven, commission-based Vendor Growth Manager to help onboard ceremony vendors across eThekwini and PMB. No CV needed — just tell us why you'd be great at it."
- Button "View the role" → `<Link to="/careers/vendor-growth-manager">`

Nav additions, both using the existing `scrollTo('careers')` pattern used for `'how'` / `'faq'`:
- Desktop nav: "Careers" button after "FAQ" (line ~176-178)
- Mobile menu: "Careers" button after the FAQ entry (line ~204)

## 2. Careers page — new `src/pages/careers/CareersVendorGrowthManager.tsx`

Note: the JSX markup in the prompt was mangled in transit (class names stripped), so the page will be rebuilt on the existing `ContactPage.tsx` visual pattern — same dark background `bg-[hsl(220_25%_7%)]`, glass card `bg-white/5 border-white/10 backdrop-blur-md`, same header (logo + Back button), same input/label styling. All copy text from the spec is preserved verbatim.

Structure:
- Header: UMCIMBI logo, Back button (like ContactPage)
- Title block: eyebrow "Careers · Commission-Based", h1 "Vendor Growth Manager", meta line "eThekwini & PMB · Flexible · Uncapped commission"
- About sections: what UMCIMBI is (Lobola, Umembeso, Umbondo, Umabo…, launched May 2026, live in KZN); the role description; "What you'll do" (Recruit / Educate / Retain bullets); "How you'll be paid" (100% commission, outcomes not hours); "What we're looking for" (5 bullets, eThekwini-based, cold outreach confidence, self-starter, student/grad welcome, prior experience a plus not a requirement); "Why work with UMCIMBI" (6 bullets: startup experience, founder access, flexible, uncapped, network, room to grow)
- Application form (mailto pattern, same as ContactPage — no backend):
  - Name (required), Email (required)
  - Story textarea, required: "Tell us about a time you convinced someone to do, buy, or support something. What was stopping them, what did you do, and what happened?" with helper text (100 words max, campus/community/side-hustle examples all count) and a live `{wordCount}/100 words` counter that turns red over the limit and disables the Submit button when over
  - Social handles input, required, placeholder "@yourhandle"
  - Submit → `mailto:andile@umcimbi.co.za` with subject "Vendor Growth Manager application — {name}" and body Name/Email/Socials/story
- `useEffect` sets `document.title` to "Vendor Growth Manager (Commission-Based) — Careers at UMCIMBI" and injects JobPosting JSON-LD (script id `umcimbi-careers-jobposting-jsonld`, removed on unmount): title, full description, datePosted 2026-09-17, validThrough 2026-12-31, employmentType CONTRACTOR, hiringOrganization UMCIMBI (sameAs umcimbi.co.za), jobLocation eThekwini, KwaZulu-Natal, ZA

## 3. Routing — `src/App.tsx`

- Import `CareersVendorGrowthManager`
- Register `<Route path="/careers/vendor-growth-manager" ... />` in BOTH the logged-out and logged-in route blocks, alongside `/contact` and `/join/vendor`

## 4. Verification (before calling it done)

Drive the running app with Playwright:
- `/onboarding`: Careers section is the last section before the footer; nav "Careers" (desktop + mobile menu) smooth-scrolls to `#careers`
- `/careers/vendor-growth-manager`: page renders, title set, JSON-LD present in head
- Paste >100 words into the story field → counter red, submit disabled; ≤100 words → enabled
- Fill the form, intercept the mailto navigation, confirm subject/body format
- Check build-errors.log is clean

## Not in this phase

Applications database table (Phase 2), edge function + auto-acknowledgment email (Phase 3), admin review + auto-decline (Phase 4).
