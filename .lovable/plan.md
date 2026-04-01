

## Plan: Update Terms of Service Content

### Summary
Five targeted changes to `src/pages/legal/TermsOfService.tsx`: update email addresses, add physical address, rewrite payment processor section, and add two new subsections (5.4 and 5.5).

### Changes (single file: `src/pages/legal/TermsOfService.tsx`)

**1. Replace `hello@umcimbi.co.za` → `andile@umcimbi.co.za`**
- Line 223 (Section 15.1)
- Line 252 (Section 19 contact block)
- Line 25 intro box stays as-is (it doesn't contain this email)

**2. Update Section 19 contact block (lines 250–255)**
Add physical address lines between company name and email:
```
37 Villa Toulouse, Eagle Trace Estate
Fourways, Gauteng, 2055
South Africa
```

**3. Rewrite Section 5.3 Payments (line 123)**
Replace the current paragraph with the Ozow-specific text referencing merchant of record status and Ozow terms.

**4. Add Section 5.4 — Cancellation & Refund Policy (after line 123)**
New `<h3>` and content covering: non-refundable deposit, balance payment timing, cancellation windows, force majeure exceptions, vendor cancellations, and refund contact email.

**5. Add Section 5.5 — Service Delivery Policy (after 5.4)**
New `<h3>` and content covering: booking confirmation, balance collection, fund holding via Ozow, service delivery, fund release (48hr auto-release), and dispute process.

### Technical details
- All new content uses the same JSX patterns: `<h3>` with `text-lg font-medium mt-6 text-foreground`, `<p>` with `text-muted-foreground`, `<ul>` with `list-disc pl-6 space-y-1`
- Numbered list in 5.5 uses `<ol className="list-decimal pl-6 space-y-2">`
- No imports or structural changes needed

