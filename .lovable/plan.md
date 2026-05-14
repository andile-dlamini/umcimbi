## Goal
Persist the uploaded vendor logo URL to `vendors.logo_url` immediately after upload.

## File
`src/pages/auth/AuthPage.tsx` — modify only the `if (logoFile)` block at ~lines 658–668.

## Change
After pushing `urlData.publicUrl` into `uploadedUrls`, add:

```ts
await supabase.from('vendors').update({ logo_url: urlData.publicUrl }).eq('id', vendorData.id);
```

## Out of scope
No other logic, files, or styling touched.