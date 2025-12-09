import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import type { Conversation, Message, ConversationWithDetails, SenderType } from '@/types/database';

export const useConversations = () => {
  const { user, isVendor, vendorProfile } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Fetch conversations
      const { data: convData, error } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      // For each conversation, fetch related data
      const enrichedConversations: ConversationWithDetails[] = await Promise.all(
        (convData || []).map(async (conv) => {
          // Fetch vendor
          const { data: vendor } = await supabase
            .from('vendors')
            .select('*')
            .eq('id', conv.vendor_id)
            .single();

          // Fetch event if exists
          let event = null;
          if (conv.event_id) {
            const { data: eventData } = await supabase
              .from('events')
              .select('*')
              .eq('id', conv.event_id)
              .single();
            event = eventData;
          }

          // Fetch user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', conv.user_id)
            .single();

          // Fetch last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Count unread messages
          const isVendorView = isVendor && vendorProfile?.id === conv.vendor_id;
          const unreadSenderType = isVendorView ? 'user' : 'vendor';
          
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('sender_type', unreadSenderType)
            .is('read_at', null);

          return {
            ...conv,
            vendor: vendor || undefined,
            event: event || undefined,
            user_profile: profile || undefined,
            last_message: lastMsg || undefined,
            unread_count: count || 0,
          } as ConversationWithDetails;
        })
      );

      setConversations(enrichedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isVendor, vendorProfile]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return { conversations, isLoading, refreshConversations: fetchConversations };
};

export const useConversation = (conversationId: string | undefined) => {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<ConversationWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConversation = async () => {
      if (!conversationId || !user) {
        setConversation(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data: conv, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .single();

        if (error) throw error;

        // Fetch vendor
        const { data: vendor } = await supabase
          .from('vendors')
          .select('*')
          .eq('id', conv.vendor_id)
          .single();

        // Fetch event if exists
        let event = null;
        if (conv.event_id) {
          const { data: eventData } = await supabase
            .from('events')
            .select('*')
            .eq('id', conv.event_id)
            .single();
          event = eventData;
        }

        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', conv.user_id)
          .single();

        setConversation({
          ...conv,
          vendor: vendor || undefined,
          event: event || undefined,
          user_profile: profile || undefined,
        });
      } catch (error) {
        console.error('Error fetching conversation:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversation();
  }, [conversationId, user]);

  return { conversation, isLoading };
};

export const useMessages = (conversationId: string | undefined) => {
  const { user, isVendor, vendorProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !user) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, user]);

  // Mark messages as read
  const markAsRead = useCallback(async (conversationId: string) => {
    if (!user) return;

    // Get the conversation to determine which messages to mark as read
    const { data: conv } = await supabase
      .from('conversations')
      .select('vendor_id')
      .eq('id', conversationId)
      .single();

    if (!conv) return;

    // Determine sender type to mark as read based on current user role
    const isVendorView = isVendor && vendorProfile?.id === conv.vendor_id;
    const senderTypeToMark: SenderType = isVendorView ? 'user' : 'vendor';

    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('sender_type', senderTypeToMark)
      .is('read_at', null);
  }, [user, isVendor, vendorProfile]);

  // Set up real-time subscription
  useEffect(() => {
    if (!conversationId) return;

    fetchMessages();

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchMessages]);

  // Mark as read when messages load
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      markAsRead(conversationId);
    }
  }, [conversationId, messages.length, markAsRead]);

  return { messages, isLoading, refreshMessages: fetchMessages };
};

export const useSendMessage = () => {
  const { user, isVendor, vendorProfile } = useAuth();
  const [isSending, setIsSending] = useState(false);

  const sendMessage = async (conversationId: string, content: string): Promise<boolean> => {
    if (!user || !content.trim()) return false;

    try {
      setIsSending(true);

      // Get conversation to determine sender type
      const { data: conv } = await supabase
        .from('conversations')
        .select('vendor_id')
        .eq('id', conversationId)
        .single();

      if (!conv) return false;

      const isVendorSender = isVendor && vendorProfile?.id === conv.vendor_id;
      const senderType: SenderType = isVendorSender ? 'vendor' : 'user';

      // Insert message
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_type: senderType,
          sender_user_id: user.id,
          content: content.trim(),
        });

      if (msgError) throw msgError;

      // Update conversation's last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    } finally {
      setIsSending(false);
    }
  };

  return { sendMessage, isSending };
};

export const useStartConversation = () => {
  const { user } = useAuth();

  const startConversation = async (
    vendorId: string,
    eventId?: string
  ): Promise<string | null> => {
    if (!user) return null;

    try {
      // Check if conversation already exists
      let query = supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id)
        .eq('vendor_id', vendorId);

      if (eventId) {
        query = query.eq('event_id', eventId);
      } else {
        query = query.is('event_id', null);
      }

      const { data: existing } = await query.single();

      if (existing) {
        return existing.id;
      }

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          vendor_id: vendorId,
          event_id: eventId || null,
        })
        .select('id')
        .single();

      if (error) throw error;
      return newConv?.id || null;
    } catch (error) {
      console.error('Error starting conversation:', error);
      return null;
    }
  };

  return { startConversation };
};
