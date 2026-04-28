# Insert Ozow Payout Test Data

Direct database inserts via the Lovable Cloud insert tool (service role, bypasses RLS). No code or migrations.

## Resolved
- First user: `957df431-0bc6-40e4-b219-de875876dd0f` (luisa@test.isiko.app)

## Inserts

**1. `public.vendors`**
- name: `TEST VENDOR - Ozow Payout Test`
- category: `catering`
- bank_name: `Capitec Bank`
- bank_account_holder_name: `Test Vendor Account`
- bank_account_number: `1234567890`
- bank_account_type: `savings`
- bank_branch_code: `470010`
- is_active: `true`
- → capture **{vendor_id}**

**2. `public.events`**
- owner_user_id: `957df431-0bc6-40e4-b219-de875876dd0f`
- name: `TEST EVENT - Ozow Payout Test`
- type: `umabo`
- date: today
- → capture **{event_id}**

**3. `public.bookings`**
- vendor_id: {vendor_id}
- event_id: {event_id}
- client_id: `957df431-0bc6-40e4-b219-de875876dd0f`
- agreed_price: `0.01` (Ozow test limit)
- booking_status: `completed`
- deposit_status: `paid`
- balance_status: `paid`
- funds_released_at: `now()`
- order_number: `UMC-O-TEST-001`
- → return **booking_id** to user
