## Drop-off bucket export — past 8 days

I queried the database for the 50 users who registered in the last 8 days and classified them by funnel stage.

### Buckets found

**Planners (40)**
- `P1 — Registered, no event created`: **24**
- `P2 — Event created, never contacted a vendor` (no service request, no chat): **15**
- `P3 — Contacted vendor, no booking`: **1**
- `P4 — Booking created, deposit unpaid`: 0
- `P5 — Paid deposit`: 0

**Vendors (10)**
- `V1 — Vendor role chosen, no vendor profile created`: **7**
- `V2 — Vendor profile created, no activity` (no quotes, no chats, no requests received): **3**
- `V2b — Vendor received request but never responded`: 0
- `V3 — Vendor active` (sent a quote or chatted): 0

### Deliverable

Generate `/mnt/documents/dropoff_buckets_past_8_days.csv` with one row per user, columns:
`bucket, role, first_name, surname, phone_number, registered_at`

Sorted by bucket then registration date. One row in the data has null name/phone (orphan profile) — it will be included under P1 with blank fields.

No code or schema changes. Single CSV artifact produced via a script, then surfaced with `<presentation-artifact>`.

Approve to run.