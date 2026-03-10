import { supabase } from '@/integrations/supabase/client';

/**
 * Sends a system notification message to the chat between a user and vendor.
 * Creates a conversation if one doesn't exist.
 * 
 * @param userId - The organiser's user ID (used to find/create conversation)
 * @param vendorId - The vendor ID (used to find/create conversation)
 * @param message - The notification message content
 * @param eventId - Optional event ID to scope the conversation
 * @param senderUserId - The user who triggered the action (for unread tracking).
 *                       Defaults to userId for backward compatibility.
 */
export async function sendChatNotification(
  userId: string,
  vendorId: string,
  message: string,
  eventId?: string,
  senderUserId?: string
): Promise<boolean> {
  try {
    // Find or create conversation
    let conversationId: string | null = null;

    // First, try to find a conversation with this event_id if provided
    if (eventId) {
      const { data: eventConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('vendor_id', vendorId)
        .eq('event_id', eventId)
        .maybeSingle();

      if (eventConv) {
        conversationId = eventConv.id;
      }
    }

    // If no event-specific conversation found and we have an eventId, create one for this event
    // If no eventId, fall back to finding any conversation between user and vendor
    if (!conversationId && !eventId) {
      const { data: anyConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('vendor_id', vendorId)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (anyConv) {
        conversationId = anyConv.id;
      }
    }

    // If still no conversation, create one (always with event_id when available)
    if (!conversationId) {
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          vendor_id: vendorId,
          event_id: eventId || null,
        })
        .select('id')
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        return false;
      }
      conversationId = newConv.id;
    }

    if (!conversationId) return false;

    // Send system message — use senderUserId so unread tracking works correctly
    const { error: msgError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_type: 'system',
      sender_user_id: senderUserId ?? userId,
      content: message,
    });

    if (msgError) {
      console.error('Error sending system message:', msgError);
      return false;
    }

    // Update conversation's last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    return true;
  } catch (error) {
    console.error('Error in sendChatNotification:', error);
    return false;
  }
}

// Notification message templates
export const notificationMessages = {
  // For vendors - when they receive a new request
  newRequestForVendor: (eventName: string, eventType: string, guestCount?: number) =>
    guestCount
      ? `🔔 New quote request! "${eventName}" (${eventType}) for ${guestCount} guests. Please review and respond.`
      : `🔔 New quote request! "${eventName}" (${eventType}). Please review and respond.`,
  
  // For clients - confirmation that request was sent
  quoteRequested: (eventName: string, vendorName: string) =>
    `📩 Quote request for "${eventName}" sent to ${vendorName}. The vendor will respond soon.`,
  
  quoteReceived: (vendorName: string, amount?: number) =>
    amount
      ? `💰 ${vendorName} has sent you a quote for R${amount.toLocaleString()}. Check your quotes to review.`
      : `💰 ${vendorName} has responded to your request. Check your quotes to review.`,
  
  quoteAccepted: (eventName: string) =>
    `✅ Quote accepted for "${eventName}"! The booking process can now begin.`,
  
  quoteDeclined: () =>
    `❌ The client has declined this quote.`,
  
  vendorDeclinedRequest: (reason?: string) =>
    reason
      ? `⚠️ The vendor has declined your request: "${reason}"`
      : `⚠️ The vendor is unable to fulfill this request at this time.`,
  
  bookingConfirmed: (eventName: string, date?: string) =>
    date
      ? `🎉 Booking confirmed for "${eventName}" on ${date}!`
      : `🎉 Booking confirmed for "${eventName}"!`,
  
  bookingCompleted: (eventName: string) =>
    `✨ Service for "${eventName}" has been marked as completed. Thank you!`,
  
  paymentReceived: (amount: number, type: 'deposit' | 'balance') =>
    `💳 ${type === 'deposit' ? 'Deposit' : 'Balance'} payment of R${amount.toLocaleString()} has been recorded.`,
};
