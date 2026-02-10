

## Clean Up Duplicate Vendor Profiles

### What We Found

Your account owns 4 vendor profiles. We want to keep only **Dlamini Premium Catering** and remove the rest:

| Vendor | Has Data? | Action |
|--------|-----------|--------|
| Dlamini Premium Catering | Keep | No change |
| Test Vendor | No linked data | Delete |
| Andile Cold Rooms | No linked data | Delete |
| Zulu Ice Cold Room Rentals | 5 bookings, 4 conversations | Deactivate (set inactive) |

### Why Not Delete All?

"Zulu Ice Cold Room Rentals" has bookings and conversations tied to it. Deleting it would break those records. Instead, we will mark it as **inactive** so it no longer appears in listings or gets selected as your active profile, but the historical data stays intact.

### Technical Steps

1. **Delete** "Test Vendor" and "Andile Cold Rooms" from the `vendors` table (no foreign key dependencies)
2. **Deactivate** "Zulu Ice Cold Room Rentals" by setting `is_active = false`
3. This ensures the AuthContext picks up only **Dlamini Premium Catering** as your active vendor profile

