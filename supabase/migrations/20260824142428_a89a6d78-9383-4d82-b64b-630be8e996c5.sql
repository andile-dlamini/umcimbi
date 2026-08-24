UPDATE public.bookings
SET booking_status = 'confirmed',
    funds_held_since = COALESCE(funds_held_since, balance_paid_at, now())
WHERE booking_status = 'completed'
  AND balance_status = 'paid'
  AND funds_released_at IS NULL;