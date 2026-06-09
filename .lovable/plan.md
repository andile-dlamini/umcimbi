1. Add `toSocialUrl()` helper function before the `VendorOnboarding` component definition in `src/pages/vendors/VendorOnboarding.tsx`. It takes a platform and a raw handle, strips leading `@`, returns the handle unchanged if it already starts with `http://` or `https://`, otherwise prefixes it with the correct base URL.

2. Update the submit payload in `handleSubmit` so that `instagram_url`, `tiktok_url`, and `facebook_url` are passed through `toSocialUrl()` instead of being sent as raw trimmed strings.

3. Update the `<Label>` text and `<Input>` placeholders for all three social fields to indicate username entry (e.g. "e.g. maswazicatering") rather than full URLs.