-- =====================================================================
-- UMCIMBI: Service region taxonomy + vendor service areas
-- Step 1 of 4: reference data, join table, RLS, event column.
-- Additive only. Nothing reads these tables yet.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Reference tables
-- ---------------------------------------------------------------------

CREATE TABLE public.service_regions (

  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  code          TEXT NOT NULL UNIQUE,

  name          TEXT NOT NULL,

  display_order INTEGER NOT NULL,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()

);

CREATE TABLE public.service_areas (

  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  region_id     UUID NOT NULL REFERENCES public.service_regions(id) ON DELETE CASCADE,

  name          TEXT NOT NULL,

  aliases       TEXT[] NOT NULL DEFAULT '{}',

  display_order INTEGER NOT NULL,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (region_id, name)

);

CREATE INDEX idx_service_areas_region_id ON public.service_areas(region_id);

-- ---------------------------------------------------------------------
-- 2. Join table: which regions a vendor serves
-- ---------------------------------------------------------------------

CREATE TABLE public.vendor_service_regions (

  vendor_id  UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,

  region_id  UUID NOT NULL REFERENCES public.service_regions(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (vendor_id, region_id)

);

CREATE INDEX idx_vendor_service_regions_region_id ON public.vendor_service_regions(region_id);

-- ---------------------------------------------------------------------
-- 3. Event location, drawn from the same taxonomy
-- ---------------------------------------------------------------------

ALTER TABLE public.events

  ADD COLUMN service_area_id UUID REFERENCES public.service_areas(id);

CREATE INDEX idx_events_service_area_id ON public.events(service_area_id);

-- ---------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------

ALTER TABLE public.service_regions        ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.service_areas          ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.vendor_service_regions ENABLE ROW LEVEL SECURITY;

-- Reference data: readable by everyone (including anonymous browse),
-- writable only by admins.

CREATE POLICY "Service regions are viewable by everyone"

  ON public.service_regions FOR SELECT USING (true);

CREATE POLICY "Admins can manage service regions"

  ON public.service_regions FOR ALL

  USING (public.has_role(auth.uid(), 'admin'))

  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service areas are viewable by everyone"

  ON public.service_areas FOR SELECT USING (true);

CREATE POLICY "Admins can manage service areas"

  ON public.service_areas FOR ALL

  USING (public.has_role(auth.uid(), 'admin'))

  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Join table: readable by everyone so browse can filter on it.
-- A vendor may manage only their own rows; admins may manage all.

CREATE POLICY "Vendor service regions are viewable by everyone"

  ON public.vendor_service_regions FOR SELECT USING (true);

CREATE POLICY "Vendor owners can add their service regions"

  ON public.vendor_service_regions FOR INSERT

  WITH CHECK (

    EXISTS (

      SELECT 1 FROM public.vendors v

      WHERE v.id = vendor_id AND v.owner_user_id = auth.uid()

    )

  );

CREATE POLICY "Vendor owners can remove their service regions"

  ON public.vendor_service_regions FOR DELETE

  USING (

    EXISTS (

      SELECT 1 FROM public.vendors v

      WHERE v.id = vendor_id AND v.owner_user_id = auth.uid()

    )

  );

CREATE POLICY "Admins can manage vendor service regions"

  ON public.vendor_service_regions FOR ALL

  USING (public.has_role(auth.uid(), 'admin'))

  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------
-- 5. Seed: 10 regions
-- ---------------------------------------------------------------------

INSERT INTO public.service_regions (code, name, display_order) VALUES

  ('ethekwini',       'Durban / eThekwini',            1),

  ('ilembe',          'North Coast / iLembe',          2),

  ('king_cetshwayo',  'Richards Bay / King Cetshwayo', 3),

  ('zululand',        'Zululand',                      4),

  ('umkhanyakude',    'Far North / uMkhanyakude',      5),

  ('midlands',        'Pietermaritzburg & Midlands',   6),

  ('northern_kzn',    'Northern KZN',                  7),

  ('uthukela',        'Ladysmith / uThukela',          8),

  ('ugu',             'South Coast / Ugu',             9),

  ('harry_gwala',     'Southern Inland / Harry Gwala', 10);

-- ---------------------------------------------------------------------
-- 6. Seed: 97 areas
-- ---------------------------------------------------------------------

INSERT INTO public.service_areas (region_id, name, aliases, display_order)

SELECT r.id, a.name, a.aliases, a.display_order

FROM (VALUES

  -- Durban / eThekwini

  ('ethekwini', 'Durban',                    ARRAY['eThekwini','Durbs'],           1),

  ('ethekwini', 'Umlazi',                    ARRAY[]::TEXT[],                      2),

  ('ethekwini', 'KwaMashu',                  ARRAY[]::TEXT[],                      3),

  ('ethekwini', 'Inanda',                    ARRAY[]::TEXT[],                      4),

  ('ethekwini', 'Ntuzuma',                   ARRAY[]::TEXT[],                      5),

  ('ethekwini', 'Phoenix',                   ARRAY[]::TEXT[],                      6),

  ('ethekwini', 'Chatsworth',                ARRAY[]::TEXT[],                      7),

  ('ethekwini', 'Pinetown',                  ARRAY[]::TEXT[],                      8),

  ('ethekwini', 'KwaDabeka',                 ARRAY[]::TEXT[],                      9),

  ('ethekwini', 'Clermont',                  ARRAY[]::TEXT[],                     10),

  ('ethekwini', 'KwaNdengezi',               ARRAY[]::TEXT[],                     11),

  ('ethekwini', 'Mariannhill',               ARRAY[]::TEXT[],                     12),

  ('ethekwini', 'Hammarsdale / Mpumalanga',  ARRAY['Hammarsdale','Mpumalanga'],   13),

  ('ethekwini', 'Hillcrest',                 ARRAY[]::TEXT[],                     14),

  ('ethekwini', 'Cato Ridge',                ARRAY[]::TEXT[],                     15),

  ('ethekwini', 'Umbumbulu',                 ARRAY[]::TEXT[],                     16),

  ('ethekwini', 'KwaMakhutha',               ARRAY[]::TEXT[],                     17),

  ('ethekwini', 'Amanzimtoti',               ARRAY['Toti'],                       18),

  ('ethekwini', 'Verulam',                   ARRAY[]::TEXT[],                     19),

  ('ethekwini', 'Tongaat',                   ARRAY[]::TEXT[],                     20),

  ('ethekwini', 'Umhlanga',                  ARRAY[]::TEXT[],                     21),

  -- North Coast / iLembe

  ('ilembe', 'Ballito',                      ARRAY[]::TEXT[],                      1),

  ('ilembe', 'KwaDukuza / Stanger',          ARRAY['KwaDukuza','Stanger'],         2),

  ('ilembe', 'Shakaskraal',                  ARRAY[]::TEXT[],                      3),

  ('ilembe', 'Groutville',                   ARRAY[]::TEXT[],                      4),

  ('ilembe', 'Mandeni / Sundumbili',         ARRAY['Mandeni','Sundumbili'],        5),

  ('ilembe', 'Ndwedwe',                      ARRAY[]::TEXT[],                      6),

  ('ilembe', 'Maphumulo',                    ARRAY[]::TEXT[],                      7),

  -- Richards Bay / King Cetshwayo

  ('king_cetshwayo', 'Richards Bay',         ARRAY[]::TEXT[],                      1),

  ('king_cetshwayo', 'Empangeni',            ARRAY[]::TEXT[],                      2),

  ('king_cetshwayo', 'Esikhaleni',           ARRAY['Esikhawini'],                  3),

  ('king_cetshwayo', 'Ngwelezane',           ARRAY['Ngwelezana'],                  4),

  ('king_cetshwayo', 'KwaMbonambi',          ARRAY[]::TEXT[],                      5),

  ('king_cetshwayo', 'Eshowe',               ARRAY[]::TEXT[],                      6),

  ('king_cetshwayo', 'Gingindlovu',          ARRAY[]::TEXT[],                      7),

  ('king_cetshwayo', 'Mtunzini',             ARRAY[]::TEXT[],                      8),

  ('king_cetshwayo', 'Melmoth',              ARRAY[]::TEXT[],                      9),

  ('king_cetshwayo', 'Nkandla',              ARRAY[]::TEXT[],                     10),

  -- Zululand

  ('zululand', 'Ulundi',                     ARRAY[]::TEXT[],                      1),

  ('zululand', 'Nongoma',                    ARRAY[]::TEXT[],                      2),

  ('zululand', 'Vryheid',                    ARRAY[]::TEXT[],                      3),

  ('zululand', 'Mondlo',                     ARRAY[]::TEXT[],                      4),

  ('zululand', 'Louwsburg',                  ARRAY[]::TEXT[],                      5),

  ('zululand', 'Pongola',                    ARRAY[]::TEXT[],                      6),

  ('zululand', 'Paulpietersburg',            ARRAY[]::TEXT[],                      7),

  -- Far North / uMkhanyakude

  ('umkhanyakude', 'Mtubatuba',              ARRAY[]::TEXT[],                      1),

  ('umkhanyakude', 'KwaMsane',               ARRAY[]::TEXT[],                      2),

  ('umkhanyakude', 'Hluhluwe',               ARRAY[]::TEXT[],                      3),

  ('umkhanyakude', 'Hlabisa',                ARRAY[]::TEXT[],                      4),

  ('umkhanyakude', 'Jozini',                 ARRAY[]::TEXT[],                      5),

  ('umkhanyakude', 'Mkuze',                  ARRAY['Mkhuze'],                      6),

  ('umkhanyakude', 'Manguzi / KwaNgwanase',  ARRAY['Manguzi','KwaNgwanase'],       7),

  -- Pietermaritzburg & Midlands

  ('midlands', 'Pietermaritzburg',           ARRAY['PMB','Maritzburg','Msunduzi'], 1),

  ('midlands', 'Edendale',                   ARRAY[]::TEXT[],                      2),

  ('midlands', 'Imbali',                     ARRAY[]::TEXT[],                      3),

  ('midlands', 'Sobantu',                    ARRAY[]::TEXT[],                      4),

  ('midlands', 'Howick',                     ARRAY[]::TEXT[],                      5),

  ('midlands', 'Mpophomeni',                 ARRAY[]::TEXT[],                      6),

  ('midlands', 'Hilton',                     ARRAY[]::TEXT[],                      7),

  ('midlands', 'Richmond',                   ARRAY[]::TEXT[],                      8),

  ('midlands', 'Camperdown',                 ARRAY[]::TEXT[],                      9),

  ('midlands', 'Wartburg',                   ARRAY[]::TEXT[],                     10),

  ('midlands', 'Mooi River',                 ARRAY[]::TEXT[],                     11),

  ('midlands', 'Greytown',                   ARRAY[]::TEXT[],                     12),

  -- Northern KZN

  ('northern_kzn', 'Newcastle',              ARRAY[]::TEXT[],                      1),

  ('northern_kzn', 'Madadeni',               ARRAY[]::TEXT[],                      2),

  ('northern_kzn', 'Osizweni',               ARRAY[]::TEXT[],                      3),

  ('northern_kzn', 'Dannhauser',             ARRAY[]::TEXT[],                      4),

  ('northern_kzn', 'Utrecht',                ARRAY[]::TEXT[],                      5),

  ('northern_kzn', 'Dundee',                 ARRAY[]::TEXT[],                      6),

  ('northern_kzn', 'Sibongile',              ARRAY[]::TEXT[],                      7),

  ('northern_kzn', 'Nquthu',                 ARRAY[]::TEXT[],                      8),

  ('northern_kzn', 'Tugela Ferry',           ARRAY[]::TEXT[],                      9),

  -- Ladysmith / uThukela

  ('uthukela', 'Ladysmith',                  ARRAY[]::TEXT[],                      1),

  ('uthukela', 'Ezakheni',                   ARRAY[]::TEXT[],                      2),

  ('uthukela', 'Steadville',                 ARRAY[]::TEXT[],                      3),

  ('uthukela', 'Estcourt',                   ARRAY[]::TEXT[],                      4),

  ('uthukela', 'Wembezi',                    ARRAY[]::TEXT[],                      5),

  ('uthukela', 'Bergville',                  ARRAY[]::TEXT[],                      6),

  ('uthukela', 'Winterton',                  ARRAY[]::TEXT[],                      7),

  -- South Coast / Ugu

  ('ugu', 'Scottburgh',                      ARRAY[]::TEXT[],                      1),

  ('ugu', 'Umzinto',                         ARRAY[]::TEXT[],                      2),

  ('ugu', 'Amandawe',                        ARRAY[]::TEXT[],                      3),

  ('ugu', 'Port Shepstone',                  ARRAY[]::TEXT[],                      4),

  ('ugu', 'Gamalakhe',                       ARRAY[]::TEXT[],                      5),

  ('ugu', 'Margate',                         ARRAY[]::TEXT[],                      6),

  ('ugu', 'Hibberdene',                      ARRAY[]::TEXT[],                      7),

  ('ugu', 'Port Edward',                     ARRAY[]::TEXT[],                      8),

  ('ugu', 'Harding',                         ARRAY[]::TEXT[],                      9),

  -- Southern Inland / Harry Gwala

  ('harry_gwala', 'Ixopo',                   ARRAY[]::TEXT[],                      1),

  ('harry_gwala', 'Highflats',               ARRAY[]::TEXT[],                      2),

  ('harry_gwala', 'Umzimkhulu',              ARRAY[]::TEXT[],                      3),

  ('harry_gwala', 'Kokstad',                 ARRAY[]::TEXT[],                      4),

  ('harry_gwala', 'Underberg',               ARRAY[]::TEXT[],                      5),

  ('harry_gwala', 'Himeville',               ARRAY[]::TEXT[],                      6),

  ('harry_gwala', 'Bulwer',                  ARRAY[]::TEXT[],                      7),

  ('harry_gwala', 'Creighton',               ARRAY[]::TEXT[],                      8)

) AS a(region_code, name, aliases, display_order)

JOIN public.service_regions r ON r.code = a.region_code;

-- ---------------------------------------------------------------------
-- 7. Grants (belt-and-braces; RLS still governs access)
-- ---------------------------------------------------------------------

GRANT SELECT ON public.service_regions        TO anon, authenticated;

GRANT SELECT ON public.service_areas          TO anon, authenticated;

GRANT SELECT ON public.vendor_service_regions TO anon, authenticated;

GRANT INSERT, DELETE ON public.vendor_service_regions TO authenticated;

GRANT ALL ON public.service_regions        TO service_role;

GRANT ALL ON public.service_areas          TO service_role;

GRANT ALL ON public.vendor_service_regions TO service_role;