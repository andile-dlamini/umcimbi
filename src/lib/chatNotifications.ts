import { supabase } from '@/integrations/supabase/client';

/**
 * Sends a system notification message to the chat between a user and vendor.
 * Creates a conversation if one doesn't exist.
 */
export async function sendChatNotification(
  userId: string,
  vendorId: string,
  message: string,
  eventId?: string
): Promise<boolean> {
  try {
    // Find or create conversation
    let conversationId: string | null = null;

    // Check if conversation exists
    let query = supabase
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('vendor_id', vendorId);

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data: existingConv } = await query.maybeSingle();

    if (existingConv) {
      conversationId = existingConv.id;
    } else {
      // Create new conversation
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

    // Send system message
    const { error: msgError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_type: 'system',
      sender_user_id: userId,
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
  quoteRequested: (eventName: string, vendorName: string) =>
    `📩 New quote request for "${eventName}" sent to ${vendorName}. The vendor will respond soon.`,
  
  quoteReceived: (vendorName: string, amount?: number) =>
    amount
      ? `💰 ${vendorName} has sent you a quote for R${amount.toLocaleString()}. Check your quotes to review.`
      : `💰 ${vendorName} has responded to your request. Check your quotes to review.`,
  
  quoteAccepted: (eventName: string) =>
    `✅ Quote accepted for "${eventName}"! The vendor has been notified.`,
  
  quoteDeclined: () =>
    `❌ Quote has been declined.`,
  
  vendorDeclinedRequest: (reason?: string) =>
    reason
      ? `⚠️ The vendor has declined your request: "${reason}"`
      : `⚠️ The vendor is unable to fulfill this request at this time.`,
  
  bookingConfirmed: (eventName: string, date?: string) =>
    date
      ? `🎉 Booking confirmed for "${eventName}" on ${date}!`
      : `🎉 Booking confirmed for "${eventName}"!`,
};
