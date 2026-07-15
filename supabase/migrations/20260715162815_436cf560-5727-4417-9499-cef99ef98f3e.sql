UPDATE public.vendors
SET
  is_active = true,
  business_verification_status = 'verified',
  name = 'Isibaya Photography',
  category = 'photographer',
  updated_at = now()
WHERE owner_user_id = '05649fcc-15f7-4a3f-91f4-bdc411d83ec1'
  AND is_demo = true;