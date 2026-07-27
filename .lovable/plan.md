Content cleanup in `src/pages/onboarding/OnboardingLanguage.tsx` only. No routing, schema, or role changes; no other files touched.

## Sections to delete
- Lines 291–315: "Why UMCIMBI" 3-pillars band
- Lines 316–432: "Planning shouldn't become chaos" problem band
- Lines 704–747: "Ceremonies we support" tiles band
- Lines 748–790: Testimonials / social proof band
- Lines 816–843: Final CTA band (footer at line 844 stays)

Deletions happen bottom-up so earlier line numbers stay valid.

## Rewording
- `id="organisers"` (around line 448): replace the 3 card entries with Trusted vendors (ShieldCheck), Comparable quotes (BarChart3), Pay safely online (LockIcon) — copy reused verbatim from the deleted pillars section.
- `id="vendors"` (around line 488): replace the 3 card entries with 4 — Get discovered by families (Users), Send quotations easily (Zap), Be verified and trusted (ShieldCheck), Stop chasing money (LockIcon).

## Imports
- Remove `Inbox`, `HandshakeIcon`, `Star` from the lucide-react import block (all unused after the edits).
- Remove `import CeremonyTile from '@/components/illustrations/CeremonyTile';` (line 45).
- Leave `CheckCircle2`, `Sparkles`, `Play`, `FeatureIcon` untouched as instructed.

## Untouched
Hero, `id="how"`, `id="faq"`, header nav, mobile menu, `scrollTo()`, PWA install logic, footer.

## Verification
- Typecheck with `tsgo`.
- Playwright screenshots of the full scroll: Hero → How it works → For Organisers (3 cards) → For Vendors (4 cards) → FAQ → Footer, checking for leftover gaps or broken band spacing where sections were removed.
