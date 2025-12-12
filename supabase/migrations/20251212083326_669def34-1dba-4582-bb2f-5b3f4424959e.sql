-- Add new vendor category values to the enum
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'invitations_stationery';
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'makeup_beauty';
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'cold_room_hire';
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'mobile_toilets';
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'attire_tailoring';
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'drinks_ice_delivery';