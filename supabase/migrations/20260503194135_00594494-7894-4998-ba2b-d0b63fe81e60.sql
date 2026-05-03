CREATE TABLE IF NOT EXISTS public.platform_events (
  id            UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type    TEXT         NOT NULL,
  actor_type    TEXT         CHECK (actor_type IN ('organiser', 'vendor', 'system', 'admin')),
  actor_id      UUID,
  session_id    TEXT,
  ceremony_type TEXT         CHECK (
    ceremony_type IN ('lobola','umembeso','umbondo','umabo','umemulo','imbeleko','ancestral_ritual')
    OR ceremony_type IS NULL
  ),
  metadata      JSONB        NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_events_type    ON public.platform_events(event_type);
CREATE INDEX IF NOT EXISTS idx_platform_events_actor   ON public.platform_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_platform_events_created ON public.platform_events(created_at DESC);

ALTER TABLE public.platform_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert own events"
    ON public.platform_events FOR INSERT
    TO authenticated
    WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anon users can insert anonymous events"
    ON public.platform_events FOR INSERT
    TO anon
    WITH CHECK (actor_id IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert platform events"
    ON public.platform_events FOR INSERT
    TO service_role WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can read platform events"
    ON public.platform_events FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.daily_briefs (
  id           UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brief_text   TEXT         NOT NULL,
  raw_stats    JSONB        NOT NULL DEFAULT '{}'::jsonb,
  email_sent   BOOLEAN      NOT NULL DEFAULT false,
  generated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_briefs_generated ON public.daily_briefs(generated_at DESC);

ALTER TABLE public.daily_briefs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admins can read daily briefs"
    ON public.daily_briefs FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert daily briefs"
    ON public.daily_briefs FOR INSERT
    TO service_role WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;