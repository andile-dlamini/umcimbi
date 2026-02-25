
-- A1) Extend messages to support types + attachments + metadata
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS metadata jsonb;

-- A2) Add deposit_percentage and sent_at to quotes
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS deposit_percentage numeric NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz;

-- A3) Create quote_line_items table
CREATE TABLE IF NOT EXISTS public.quote_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quote_line_items_quote_id_idx ON public.quote_line_items(quote_id);

-- A4) RLS for quote_line_items
ALTER TABLE public.quote_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view quote line items"
ON public.quote_line_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.quotes q
  JOIN public.service_requests sr ON sr.id = q.request_id
  WHERE q.id = quote_line_items.quote_id AND sr.requester_user_id = auth.uid()
));

CREATE POLICY "Vendors can view their quote line items"
ON public.quote_line_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.quotes q
  JOIN public.vendors v ON v.id = q.vendor_id
  WHERE q.id = quote_line_items.quote_id AND v.owner_user_id = auth.uid()
));

CREATE POLICY "Vendors can insert quote line items"
ON public.quote_line_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.quotes q
  JOIN public.vendors v ON v.id = q.vendor_id
  WHERE q.id = quote_line_items.quote_id AND v.owner_user_id = auth.uid()
));

CREATE POLICY "Vendors can update quote line items"
ON public.quote_line_items FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.quotes q
  JOIN public.vendors v ON v.id = q.vendor_id
  WHERE q.id = quote_line_items.quote_id AND v.owner_user_id = auth.uid()
));

CREATE POLICY "Vendors can delete quote line items"
ON public.quote_line_items FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.quotes q
  JOIN public.vendors v ON v.id = q.vendor_id
  WHERE q.id = quote_line_items.quote_id AND v.owner_user_id = auth.uid()
));

-- B) Create chat-attachments storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: conversation participants can read chat attachments
CREATE POLICY "Conversation participants can read chat attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-attachments'
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id::text = (storage.foldername(name))[2]
    AND (c.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.vendors v WHERE v.id = c.vendor_id AND v.owner_user_id = auth.uid()
    ))
  )
);

-- Storage RLS: conversation participants can upload chat attachments
CREATE POLICY "Conversation participants can upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id::text = (storage.foldername(name))[2]
    AND (c.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.vendors v WHERE v.id = c.vendor_id AND v.owner_user_id = auth.uid()
    ))
  )
);
