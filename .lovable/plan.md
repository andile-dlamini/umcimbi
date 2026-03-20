

## Privacy Policy & Terms of Service — Using Your Document

I've read the full document. It's comprehensive and well-structured. Here's the plan:

### Approach

Create two light-themed public pages that render the exact content from your DOCX, properly formatted with headings, bullet lists, and info boxes.

### Files

| File | Action |
|------|--------|
| `src/pages/legal/PrivacyPolicy.tsx` | New — Part A content (Sections 1–14) |
| `src/pages/legal/TermsOfService.tsx` | New — Part B content (Sections 1–19) |
| `src/pages/onboarding/OnboardingLanguage.tsx` | Update footer: "Privacy" → `/privacy`, "Terms" → `/terms` |
| `src/App.tsx` | Add `/privacy` and `/terms` as public routes |

### Page Design

- Light theme, clean layout with `max-w-3xl` readable width
- UMCIMBI logo at top + back button
- "Effective Date: 1 May 2026 · Version 1.0" shown at top
- Proper heading hierarchy (h1 for title, h2 for sections, h3 for subsections)
- Styled info boxes for the callout blocks (e.g., Information Officer details, Information Regulator)
- Bullet lists rendered as proper `<ul>` elements
- Mini footer with social icons + copyright
- Fully responsive

### Content Mapping

**Privacy Policy** — all 14 sections from Part A:
1. Introduction & Who We Are (with info box)
2. Definitions
3. Information We Collect (3.1–3.3)
4. How We Use Your Information (4.1–4.4)
5. Legal Bases for Processing
6. How We Share Your Information (6.1–6.5)
7. Cross-Border Transfer
8. How We Protect Your Information
9. Retention of Personal Information
10. Cookies & Tracking Technologies
11. Your Rights as a Data Subject (with info box for Information Regulator)
12. Children's Privacy
13. Changes to This Privacy Policy
14. Contact Us

**Terms of Service** — all 19 sections from Part B:
1. Introduction & Acceptance
2. The UMCIMBI Platform
3. Account Registration (3.1–3.3)
4. Vendor Terms (4.1–4.4)
5. Customer Terms (5.1–5.3)
6. Prohibited Conduct
7. Intellectual Property (7.1–7.2)
8. Disclaimer of Warranties
9. Limitation of Liability
10. Indemnification
11. Dispute Resolution (11.1–11.3)
12. Consumer Protection Act Compliance
13. Electronic Communications & ECTA
14. Platform Availability & Modifications
15. Termination (15.1–15.3)
16. Changes to These Terms
17. Severability
18. Entire Agreement
19. Contact Us

### Routing

Both `/privacy` and `/terms` added as unauthenticated public routes alongside `/onboarding`, `/auth`, and `/contact`.

