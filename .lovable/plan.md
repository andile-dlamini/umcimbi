# Settings.tsx targeted fixes

Three scoped changes to `src/pages/Settings.tsx` only. No other files modified.

## Fix 1 — Hide internal `@phone.isiko.app` emails

Phone-registered users get a synthetic email like `27821234567@phone.isiko.app`. This is an internal system detail and must not be shown. Real emails stay visible.

In the view-mode block of the User Info Card, replace:
```tsx
{user?.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
```
with a conditional that also excludes `@phone.isiko.app`.

## Fix 2 — Add address fields to profile editor

The `profiles` table already has `address_line_1`, `address_line_2`, `city`, `postal_code`. Make them editable and viewable for all users (planners + vendors).

Five sub-edits:
- **2a** Extend `editData` initial state to include the four address fields.
- **2b** Populate address fields in `startEditing()` from `profile`.
- **2c** Include address fields in the Supabase `update()` call in `handleSaveProfile`.
- **2d** Add address inputs (line 1, line 2, city + postal in a row) to the edit form, and apply the same `@phone.isiko.app` filter to the email shown in edit mode.
- **2e** In view mode, display a combined address line (`address_line_1, city, postal_code`) below the phone number when `city` is set.

## Fix 3 — Left-align Edit Vendor Profile button

Add `justify-start` to the "Edit Vendor Profile" outline button so its text aligns left, consistent with the role-switch button above it.

## Technical notes

- All address access uses `(profile as any)?.field` to avoid touching `Profile` type imports.
- No DB schema changes — columns already exist.
- No changes to AuthContext, AddressFields component, or any other file.
- Phone-email filter uses `user.email.includes('@phone.isiko.app')` in both view and edit branches for consistency.
