

## Plan: Update Terms of Service and Registration Checkbox

### Summary
Four additions: new section 4.5 (vendor disclaimer), new paragraph in section 9, new section 20 (force majeure), and updated T&C checkbox with actual links.

### Changes

**File 1: `src/pages/legal/TermsOfService.tsx`**

1. After section 4.4 (line 96), insert new subsection **4.5 Independent Vendor Status & Platform Disclaimer** with the full disclaimer text, bullet list, and closing paragraph as specified.

2. After the existing section 9 closing paragraph (line 159), insert the explicit liability exclusion paragraph for personal injury, illness, food poisoning, etc.

3. After section 19 (line 244, before `</main>`), insert new **Section 20. Force Majeure** with both paragraphs as specified.

**File 2: `src/pages/auth/AuthPage.tsx`**

4. Update the checkbox label (around line 1205-1207) to replace the current plain text with actual `<Link>` elements:
   - "Terms of Service" links to `/terms`
   - "Privacy Policy" links to `/privacy` (replacing the POPIA reference)
   - Import `Link` from `react-router-dom` (likely already imported)
   - The label becomes: *"I have read and agree to the [Terms of Service](/terms) and [Privacy Policy](/privacy)"*

No existing sections are removed or modified. The submit button is already disabled when `terms_accepted` is false, so no additional gating is needed.

