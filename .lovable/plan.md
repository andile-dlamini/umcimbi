# Refine Careers copy and contact fields

## Changes
- Keep the Open roles introduction on one line at desktop widths by widening its text area.
- Replace em dashes throughout the dedicated Vendor Growth Manager page with commas or suitable punctuation.
- Keep one required social-media field, but clarify that applicants can enter Instagram, TikTok, and Facebook handles together, with a multi-handle example.
- Add a required phone number beneath email with South African phone validation.
- Save the phone number with each application and show it in the Careers admin review panel.

## Technical details
- Add a nullable `phone` column to existing applications so older entries remain valid.
- Validate and normalise new phone submissions in both the page and public submission function.
- Deploy the updated submission function and verify the full form flow, saved row, admin detail, and mobile layout.
