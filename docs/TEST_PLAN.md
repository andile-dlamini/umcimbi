# UMCIMBI / Isiko Planner — E2E Test Plan (Spec v2)

## DISCOVERED MISMATCHES (Spec vs Implementation)

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| M1 | **Admin route has NO guard** | 🔴 Critical | `/admin`, `/admin/*` routes render for ANY authenticated user. No `isAdmin` check in `AdminDashboard.tsx` or route guards. Any logged-in user can view admin stats and navigate to verification queue, super vendor management, bulk upload. |
| M2 | **Booking created client-side, not server-side** | 🟡 Medium | `generate-final-offer` only updates quote status + stores PDF. The booking is created client-side in `MyQuotes.tsx` `handleAcceptQuote()`. This means a client could accept a quote (PDF generated) but booking creation could fail silently, leaving an inconsistent state. |
| M3 | **Quote status `client_accepted` vs spec's `accepted`** | 🟢 Info | DB enum uses `client_accepted` (not `accepted`). Code is consistent with this. Spec v2 should use `client_accepted` as canonical. Already aligned in code. |
| M4 | **Payment status is stored, not derived** | 🟡 Medium | Spec says "compute payment status deterministically from timestamps". Implementation stores status directly and updates timestamps as side effects. Status is NOT re-derived on read — if timestamps are manually corrected, status stays stale. |
| M5 | **`quote-pdfs` bucket has no explicit storage RLS policies** | 🟡 Medium | Bucket is private (good), but no `storage.objects` RLS policies are visible. Access relies entirely on `get-final-offer-url` signed URLs. Direct SDK calls from client would be blocked by default private bucket. |
| M6 | **Vendor-initiated quotes bypass `service_requests` INSERT RLS** | 🟡 Medium | `CreateQuoteDialog` inserts into `service_requests` with `origin: 'vendor_initiated'`, but the vendor INSERT policy requires `v.owner_user_id = auth.uid()`. The `requester_user_id` is set to the client's ID, not the vendor's. This may fail if the first INSERT policy (`requester_user_id = auth.uid()`) is checked. A second vendor-specific INSERT policy exists which should match. |

---

## SUITE 1: Authentication & OTP

| ID | Type | Test Case | Expected Result |
|----|------|-----------|-----------------|
| AUTH-HP-01 | Happy | Send OTP to valid E.164 number | 200, success:true, otp_requests row created |
| AUTH-HP-02 | Happy | Verify OTP with correct code | 200, user created, profile updated, phone_verified=true |
| AUTH-HP-03 | Happy | Login with created credentials | Session returned |
| AUTH-EC-01 | Edge | Send OTP with leading zero (0812345678) | Normalized to +27812345678 |
| AUTH-EC-02 | Edge | Send OTP to invalid number (too short) | 400 error |
| AUTH-EC-03 | Edge | Verify with wrong code | 400, attempts_remaining decremented |
| AUTH-EC-04 | Edge | Verify expired OTP | 400, expired:true |
| AUTH-EC-05 | Edge | Exceed max attempts (5) | 429, locked:true |
| AUTH-RL-01 | Rate limit | 3+ sends in 15 min window | Silent rate limit (200 but no SMS) |
| AUTH-RL-02 | Rate limit | Resend within 30s cooldown | 429, cooldown:true |

## SUITE 2: Roles & Route Guards

| ID | Type | Test Case | Expected Result |
|----|------|-----------|-----------------|
| ROLE-HP-01 | Happy | New user gets 'user' role | user_roles row with role='user' |
| ROLE-HP-02 | Happy | Vendor onboarding adds 'vendor' role | user_roles row with role='vendor' via trigger |
| ROLE-HP-03 | Happy | Role switcher toggles vendor mode | Body class 'vendor-mode' toggled, nav changes |
| ADM-SEC-01 | Security | Non-admin accesses /admin | **FAILS** — currently renders. Needs fix. |
| ADM-SEC-02 | Security | Non-admin calls admin DB queries | RLS blocks (profiles select limited) |

## SUITE 3: Events

| ID | Type | Test Case | Expected Result |
|----|------|-----------|-----------------|
| EVT-HP-01 | Happy | Create event with all fields | Event row created, owner_user_id = auth.uid() |
| EVT-HP-02 | Happy | View event dashboard tabs | All 4 tabs render (Vendors, Tasks, Guests, Budget) |
| EVT-RLS-01 | Security | U2 tries to view U1's event | RLS blocks, no data returned |
| EVT-RLS-02 | Security | U2 tries to create task on U1's event | RLS blocks INSERT |

## SUITE 4: Vendor Discovery

| ID | Type | Test Case | Expected Result |
|----|------|-----------|-----------------|
| VDC-HP-01 | Happy | Browse vendors list | Active vendors returned |
| VDC-HP-02 | Happy | Filter by category | Only matching category shown |
| VDC-HP-03 | Happy | "Verified only" toggle | Only business_verification_status='verified' |
| VDC-HP-04 | Happy | "Super Vendors only" toggle | Only is_super_vendor=true |
| VDC-HP-05 | Happy | Sort order: Super > Verified > Rating | Correct ordering |
| VDC-HP-06 | Happy | View vendor detail increments view_count | view_count += 1 |

## SUITE 5: Vendor Onboarding

| ID | Type | Test Case | Expected Result |
|----|------|-----------|-----------------|
| VON-HP-01 | Happy | Independent vendor onboarding | Vendor created, business_verification_status='not_applicable' |
| VON-HP-02 | Happy | Registered business onboarding | Vendor created, status='pending', docs uploaded |
| VON-HP-03 | Happy | Re-visiting onboarding with existing profile | Redirected to dashboard |
| VON-HP-04 | Happy | Letterhead toggle set during onboarding | letterhead_enabled stored correctly |
| VON-EC-01 | Edge | Gallery > 5 images | Truncated to 5 by trigger |

## SUITE 6: Quotation Flow — Path A (Client-initiated)

| ID | Type | Test Case | Expected Result |
|----|------|-----------|-----------------|
| QTA-HP-01 | Happy | Client sends quote request | service_request created, status='pending', origin='client_initiated' |
| QTA-HP-02 | Happy | Vendor responds with quote | service_request → 'quoted', quote record created status='pending_client' |
| QTA-HP-03 | Happy | Quote expires_at set | expires_at = created_at + 48h |
| QTA-EC-01 | Edge | Duplicate request same vendor+event | 23505 unique constraint error |
| QTA-RLS-01 | Security | U2 cannot see U1's requests | RLS blocks |

## SUITE 7: Quotation Flow — Path B (Vendor-initiated)

| ID | Type | Test Case | Expected Result |
|----|------|-----------|-----------------|
| QTB-HP-01 | Happy | Vendor creates quote from dialog | service_request created with origin='vendor_initiated', quote record created |
| QTB-HP-02 | Happy | Quote appears in client's MyQuotes | Client sees vendor-initiated quote |
| QTB-EC-01 | Edge | No existing request → creates new | service_request + quote both created |
| QTB-EC-02 | Edge | Existing request → updates + creates quote | service_request updated, new quote created |

## SUITE 8: Quote Acceptance + PDF Generation

| ID | Type | Test Case | Expected Result |
|----|------|-----------|-----------------|
| ACC-HP-01 | Happy | Accept pending_client quote | generate-final-offer: status→client_accepted, offer_number set, PDF stored, other quotes declined |
| ACC-HP-02 | Happy | PDF content correct | HTML contains offer number, parties, event details, amount, payment terms |
| ACC-HP-03 | Happy | Letterhead layout used | When letterhead_enabled=true AND (logo OR registered_business_name) |
| ACC-HP-04 | Happy | Fallback layout used | When letterhead_enabled=false and no logo/registered_business_name |
| ACC-HP-05 | Happy | Offer number format | UMC-Q-YYYY-NNNNNN, sequential |
| ACC-EC-01 | Edge | Accept already accepted quote | 400: "Quote is no longer pending" |
| ACC-EC-02 | Edge | Accept expired quote | 400: "Quote has expired", status set to 'expired' |
| ACC-EC-03 | Edge | Non-client tries to accept | 403: "Only the client can accept" |
| ACC-EC-04 | Edge | Idempotent: re-upload same PDF key | upsert succeeds |

## SUITE 9: PDF Security

| ID | Type | Test Case | Expected Result |
|----|------|-----------|-----------------|
| PDF-SEC-01 | Security | Client gets signed URL | 200, url returned, 5-min expiry |
| PDF-SEC-02 | Security | Vendor owner gets signed URL | 200, url returned |
| PDF-SEC-03 | Security | Admin gets signed URL | 200, url returned |
| PDF-SEC-04 | Security | Unrelated user denied | 403: "Access denied" |
| PDF-SEC-05 | Security | Unauthenticated request | 401: "Unauthorized" |
| PDF-SEC-06 | Security | Direct bucket access without signed URL | Blocked (private bucket) |

## SUITE 10: Bookings & Payments

| ID | Type | Test Case | Expected Result |
|----|------|-----------|-----------------|
| BOOK-HP-01 | Happy | Booking created on quote acceptance | agreed_price set, deposit=30%, balance=70% |
| BOOK-HP-02 | Happy | deposit_due_at set on creation | Timestamp populated |
| BOOK-HP-03 | Happy | Mark deposit paid | deposit_status='paid', deposit_paid_at set, booking_status='confirmed', balance_status='due' |
| BOOK-HP-04 | Happy | Mark balance paid | balance_status='paid', balance_paid_at set |
| BOOK-HP-05 | Happy | Mark as completed | booking_status='completed' |
| BOOK-EC-01 | Edge | Report problem | booking_status='disputed' |
| BOOK-RLS-01 | Security | U2 cannot view U1's bookings | RLS blocks |
| BOOK-RLS-02 | Security | Only vendor/client can update booking | RLS enforced |

## SUITE 11: Reviews

| ID | Type | Test Case | Expected Result |
|----|------|-----------|-----------------|
| REV-HP-01 | Happy | Client submits booking review | booking_review created |
| REV-HP-02 | Happy | Vendor submits booking review | booking_review created |
| REV-HP-03 | Happy | Vendor review updates vendor.rating | Trigger recalculates avg |
| REV-EC-01 | Edge | Review on non-completed booking | RLS blocks INSERT |
| REV-EC-02 | Edge | Duplicate review | 23505 unique constraint |

## SUITE 12: Chat

| ID | Type | Test Case | Expected Result |
|----|------|-----------|-----------------|
| CHAT-HP-01 | Happy | System notification on quote received | Message with sender_type='system' |
| CHAT-HP-02 | Happy | User sends message | Message created, conversation updated |
| CHAT-RLS-01 | Security | U2 cannot view U1's conversations | RLS blocks |
| CHAT-RLS-02 | Security | U2 cannot send messages in U1's conversation | RLS blocks INSERT |

## SUITE 13: Admin Tools

| ID | Type | Test Case | Expected Result |
|----|------|-----------|-----------------|
| ADM-HP-01 | Happy | Approve vendor verification | business_verification_status='verified' |
| ADM-HP-02 | Happy | Reject vendor verification | business_verification_status='rejected' |
| ADM-HP-03 | Happy | Toggle super vendor status | is_super_vendor toggled, reason recorded |
| ADM-HP-04 | Happy | Bulk vendor upload | Vendors created from spreadsheet |

## SUITE 14: Storage / Bucket RLS

| ID | Type | Test Case | Expected Result |
|----|------|-----------|-----------------|
| STR-HP-01 | Happy | Upload vendor image | Stored in vendor-images bucket |
| STR-HP-02 | Happy | Upload avatar | Stored in avatars bucket |
| STR-SEC-01 | Security | quote-pdfs not publicly accessible | Private bucket, no public URL |
| STR-SEC-02 | Security | Signed URL expires after 5 min | URL returns 400 after expiry |
