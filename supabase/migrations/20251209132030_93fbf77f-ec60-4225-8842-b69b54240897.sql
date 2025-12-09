-- Create sender_type enum
CREATE TYPE public.sender_type AS ENUM ('user', 'vendor', 'system');

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, vendor_id, event_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_type sender_type NOT NULL,
  sender_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations RLS policies
-- Users can view conversations they are part of (as user or vendor owner)
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.vendors 
    WHERE vendors.id = conversations.vendor_id 
    AND vendors.owner_user_id = auth.uid()
  )
);

-- Users can create conversations where they are the user
CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update conversations they are part of
CREATE POLICY "Users can update their conversations"
ON public.conversations FOR UPDATE
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.vendors 
    WHERE vendors.id = conversations.vendor_id 
    AND vendors.owner_user_id = auth.uid()
  )
);

-- Messages RLS policies
-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (
      c.user_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM public.vendors v
        WHERE v.id = c.vendor_id AND v.owner_user_id = auth.uid()
      )
    )
  )
);

-- Users can insert messages in their conversations
CREATE POLICY "Users can insert messages in their conversations"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_user_id AND
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (
      c.user_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM public.vendors v
        WHERE v.id = c.vendor_id AND v.owner_user_id = auth.uid()
      )
    )
  )
);

-- Users can update messages (for read_at) in their conversations
CREATE POLICY "Users can update messages in their conversations"
ON public.messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (
      c.user_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM public.vendors v
        WHERE v.id = c.vendor_id AND v.owner_user_id = auth.uid()
      )
    )
  )
);

-- Add updated_at trigger for conversations
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER TABLE public.messages REPLICA IDENTITY FULL;