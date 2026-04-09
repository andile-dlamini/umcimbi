import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, FileText, Loader2, Image as ImageIcon, Info, X, Star, Upload, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { useConversationBooking } from '@/hooks/useConversationBooking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useConversation, useMessages, useSendMessage } from '@/hooks/useChat';
import { useAuth } from '@/context/AuthContext';
import { format, isToday, isYesterday } from 'date-fns';
import { QuoteCard } from '@/components/chat/QuoteCard';
import { MakeQuotationSheet, QuotePrefillData } from '@/components/chat/MakeQuotationSheet';
import { ReviewDialog } from '@/components/chat/ReviewDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChatDetailsDrawer } from '@/components/chat/ChatDetailsDrawer';

const ChatThread = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user, isVendor, vendorProfile } = useAuth();
  const { conversation, isLoading: convLoading } = useConversation(conversationId);
  const { messages, isLoading: msgLoading, refreshMessages } = useMessages(conversationId);
  const { sendMessage, isSending } = useSendMessage();
  const [newMessage, setNewMessage] = useState('');
  const [showQuotationSheet, setShowQuotationSheet] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [quotePrefill, setQuotePrefill] = useState<QuotePrefillData | null>(null);
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const proofFileInputRef = useRef<HTMLInputElement>(null);

  const isVendorView = isVendor && vendorProfile?.id === conversation?.vendor_id;

  const clientUserId = isVendorView
    ? (conversation as any)?.user_profile?.user_id || conversation?.user_id
    : user?.id;
  const vendorId = conversation?.vendor_id;

  const {
    booking: activeBooking,
    deliveryProofs: bookingProofs,
    refreshBooking,
  } = useConversationBooking(conversationId, vendorId, clientUserId);

  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDisputing, setIsDisputing] = useState(false);

  // Adjustment request state (client side)
  const [adjustmentQuoteId, setAdjustmentQuoteId] = useState<string | null>(null);
  const [adjustmentNote, setAdjustmentNote] = useState('');
  const [showAdjustmentInput, setShowAdjustmentInput] = useState(false);

  const handleRequestAdjustment = (quoteId: string) => {
    setAdjustmentQuoteId(quoteId);
    setShowAdjustmentInput(true);
  };

  const handleSendAdjustment = async () => {
    if (!adjustmentNote.trim() || !conversationId || !adjustmentQuoteId) return;

    try {
      // Fetch current quote details for the adjustment card
      const { data: quoteData, error: fetchErr } = await supabase
        .from('quotes')
        .select('adjustment_count, price, deposit_percentage, offer_number, final_offer_pdf_key')
        .eq('id', adjustmentQuoteId)
        .single();

      if (fetchErr || !quoteData) {
        toast.error('Failed to load quote details');
        return;
      }

      const newCount = (quoteData.adjustment_count || 0) + 1;
      const platformFee = Math.round(quoteData.price * 0.08 * 100) / 100;
      const totalWithFee = quoteData.price + platformFee;
      const depositAmount = Math.round(totalWithFee * (quoteData.deposit_percentage / 100) * 100) / 100;

      // Send adjustment requested card as a quote_card message FIRST (before updating quote)
      const adjustmentMetadata = {
        quote_id: adjustmentQuoteId,
        offer_number: quoteData.offer_number,
        total: quoteData.price,
        deposit_percentage: quoteData.deposit_percentage,
        deposit_amount: depositAmount,
        platform_fee: platformFee,
        vendor_payout: quoteData.price,
        pdf_key: quoteData.final_offer_pdf_key || '',
        status: 'adjustment_requested',
        booking_id: null,
        adjustment_count: newCount,
        adjustment_note: adjustmentNote.trim(),
      };

      const { error: msgError } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_type: 'user' as const,
        sender_user_id: user?.id,
        message_type: 'quote_card',
        content: `📝 Adjustment requested: ${adjustmentNote.trim()}`,
        metadata: adjustmentMetadata,
      });

      if (msgError) {
        console.error('Error inserting adjustment message:', msgError);
        toast.error('Failed to send adjustment request');
        return;
      }

      // Now update quote status to adjustment_requested
      const { error: updateErr } = await supabase
        .from('quotes')
        .update({
          status: 'adjustment_requested' as any,
          adjustment_reason: adjustmentNote.trim(),
          adjustment_count: newCount,
        })
        .eq('id', adjustmentQuoteId);

      if (updateErr) {
        console.error('Error updating quote status:', updateErr);
        toast.error('Adjustment message sent but status update failed');
      }

      // Update conversation timestamp
      await supabase.from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      setAdjustmentNote('');
      setShowAdjustmentInput(false);
      setAdjustmentQuoteId(null);
      refreshMessages();
    } catch (err) {
      console.error('Error in handleSendAdjustment:', err);
      toast.error('Failed to send adjustment request');
    }
  };

  // Vendor: handle "Adjust Quote" - fetch existing line items and open pre-filled sheet
  const handleAdjustQuote = async (quoteId: string) => {
    try {
      const { data: quote } = await supabase
        .from('quotes')
        .select('deposit_percentage, notes')
        .eq('id', quoteId)
        .single();

      const { data: lineItems } = await supabase
        .from('quote_line_items')
        .select('description, quantity, unit_price, sort_order')
        .eq('quote_id', quoteId)
        .order('sort_order', { ascending: true });

      setQuotePrefill({
        quoteId,
        lineItems: (lineItems || []).map(li => ({
          description: li.description,
          quantity: li.quantity,
          unit_price: Number(li.unit_price),
        })),
        depositPercentage: quote?.deposit_percentage || 50,
        notes: quote?.notes || '',
      });
      setShowQuotationSheet(true);
    } catch (err) {
      console.error('Error fetching quote for adjustment:', err);
      toast.error('Failed to load quote details');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !conversationId) return;
    const success = await sendMessage(conversationId, newMessage);
    if (success) setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId || !user) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only images (JPEG, PNG, WebP) and PDFs are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const filePath = `conversations/${conversationId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const isImage = file.type.startsWith('image/');
      const attachment = {
        bucket: 'chat-attachments',
        path: filePath,
        mime: file.type,
        name: file.name,
      };

      const { error: msgError } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_type: isVendorView ? 'vendor' : 'user',
        sender_user_id: user.id,
        message_type: isImage ? 'image' : 'text',
        content: isImage ? '' : file.name,
        attachments: [attachment],
      });

      if (msgError) throw msgError;

      await supabase.from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeBooking) return;

    setIsUploadingProof(true);
    try {
      const path = `${activeBooking.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('delivery-proofs')
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('delivery-proofs')
        .getPublicUrl(path);

      const { data, error } = await supabase.functions.invoke(
        'upload-delivery-proof',
        { body: { booking_id: activeBooking.id, photo_url: urlData.publicUrl } }
      );
      if (error || data?.error) throw error || new Error(data.error);

      toast.success('Proof uploaded! Payment will be released within 48 hours.');
      refreshBooking();
      refreshMessages();
    } catch (err: any) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploadingProof(false);
      if (proofFileInputRef.current) proofFileInputRef.current.value = '';
    }
  };

  const handleConfirmDelivery = async () => {
    if (!activeBooking || isConfirming) return;
    setIsConfirming(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'confirm-delivery',
        { body: { booking_id: activeBooking.id } }
      );
      if (error || data?.error) throw error || new Error(data.error);
      toast.success('Service confirmed! Payment will be released.');
      refreshBooking();
      refreshMessages();
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm delivery');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRaiseDispute = async () => {
    if (!activeBooking || isDisputing) return;
    setIsDisputing(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'raise-dispute',
        { body: { booking_id: activeBooking.id } }
      );
      if (error || data?.error) throw error || new Error(data.error);
      toast.success('Dispute raised. Admin has been notified.');
      refreshBooking();
      refreshMessages();
    } catch (err: any) {
      toast.error(err.message || 'Failed to raise dispute');
    } finally {
      setIsDisputing(false);
    }
  };

  const getSignedUrl = useCallback(async (bucket: string, path: string) => {
    const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 300);
    return data?.signedUrl || '';
  }, []);

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return `Yesterday ${format(date, 'HH:mm')}`;
    return format(date, 'dd MMM HH:mm');
  };

  const isOwnMessage = (senderType: string) => {
    if (isVendorView) return senderType === 'vendor';
    return senderType === 'user';
  };

  if (convLoading || msgLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Conversation not found</p>
      </div>
    );
  }

  const userDisplayName = conversation.user_profile?.full_name
    || [conversation.user_profile?.first_name, conversation.user_profile?.surname].filter(Boolean).join(' ')
    || conversation.user_profile?.phone_number
    || 'User';
  const headerTitle = isVendorView ? userDisplayName : conversation.vendor?.name || 'Vendor';
  const headerSubtitle = isVendorView
    ? conversation.user_profile?.email
    : conversation.vendor?.category;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground truncate">{headerTitle}</h1>
            {headerSubtitle && (
              <p className="text-xs text-muted-foreground capitalize">{headerSubtitle}</p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowDetailsDrawer(true)} className="shrink-0">
            <Info className="h-5 w-5" />
          </Button>
        </div>
        {conversation.event && (
          <div className="mt-2 ml-11">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
              Regarding: {conversation.event.name} ({conversation.event.type})
            </span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-center">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = isOwnMessage(message.sender_type);
            const isSystem = message.sender_type === 'system' || (message as any).message_type === 'system';
            const messageType = (message as any).message_type || 'text';
            const metadata = (message as any).metadata;
            const attachments = (message as any).attachments || [];

            // Filter visibility-tagged system messages
            if (isSystem && metadata?.visibility) {
              const vis = metadata.visibility;
              if (vis === 'client' && isVendorView) return null;
              if (vis === 'vendor' && !isVendorView) return null;
            }

            // Review Prompt
            if (messageType === 'review_prompt' && metadata?.booking_id) {
              return (
                <div key={message.id} className="flex justify-center">
                  <div className="max-w-[70%] rounded-xl px-4 py-3 bg-primary/5 border-2 border-primary/20 text-center space-y-2">
                    <p className="text-sm text-foreground">{message.content}</p>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => setReviewBookingId(metadata.booking_id)}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Leave a Review
                    </Button>
                    <p className="text-[10px] text-muted-foreground/70">
                      {formatMessageTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            }

            // Quote Card
            if (messageType === 'quote_card' && metadata) {
              return (
              <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} w-full`}>
                  <div className={`w-[500px] max-w-[85vw] ${isOwn ? 'ml-auto' : ''}`}>
                  <QuoteCard
                    metadata={metadata}
                    isVendorView={isVendorView}
                    messageId={message.id}
                    onStatusChange={refreshMessages}
                    onRequestAdjustment={!isVendorView ? handleRequestAdjustment : undefined}
                    onAdjustQuote={isVendorView ? handleAdjustQuote : undefined}
                  />
                  </div>
                </div>
              );
            }

            // System message
            if (isSystem) {
              return (
                <div key={message.id} className="flex justify-center">
                  <div className="max-w-[70%] rounded-xl px-4 py-2 bg-muted/50 border border-border">
                    <p className="text-sm text-center whitespace-pre-wrap text-muted-foreground">
                      {message.content}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 text-center mt-1">
                      {formatMessageTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            }

            // Image message
            if (messageType === 'image' && attachments.length > 0) {
              return (
                <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl overflow-hidden ${
                    isOwn ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'
                  }`}>
                    <ImageAttachment attachment={attachments[0]} getSignedUrl={getSignedUrl} />
                    {message.content && (
                      <p className="text-sm px-3 py-1 whitespace-pre-wrap break-words">{message.content}</p>
                    )}
                    <p className={`text-[10px] px-3 pb-2 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {formatMessageTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            }

            // Regular text message
            return (
              <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  isOwn ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'
                }`}>
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  <p className={`text-[10px] mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {formatMessageTime(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-background border-t border-border p-4">
        {/* Adjustment request bar (client) */}
        {showAdjustmentInput && (
          <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded-lg">
            <Input
              value={adjustmentNote}
              onChange={(e) => setAdjustmentNote(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSendAdjustment(); } }}
              placeholder="e.g. Change guests from 80 to 100…"
              className="flex-1"
              autoFocus
            />
            <Button size="sm" onClick={handleSendAdjustment} disabled={!adjustmentNote.trim() || isSending}>Send</Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowAdjustmentInput(false); setAdjustmentNote(''); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {/* Vendor actions toolbar */}
        {isVendorView && (
          <div className="flex gap-2 mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setQuotePrefill(null); setShowQuotationSheet(true); }}
            >
              <FileText className="h-4 w-4 mr-1" />
              Make Quotation
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
            disabled={isSending}
          />
          <Button onClick={handleSend} disabled={!newMessage.trim() || isSending} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Make Quotation Sheet */}
      <MakeQuotationSheet
        open={showQuotationSheet}
        onOpenChange={setShowQuotationSheet}
        conversationId={conversationId || ''}
        eventName={conversation.event?.name}
        eventDate={conversation.event?.date ? format(new Date(conversation.event.date), 'dd MMM yyyy') : undefined}
        eventLocation={conversation.event?.location || undefined}
        onSuccess={refreshMessages}
        prefillData={quotePrefill}
      />

      {/* Chat Details Drawer */}
      <ChatDetailsDrawer
        open={showDetailsDrawer}
        onOpenChange={setShowDetailsDrawer}
        conversationId={conversationId || ''}
        isVendorView={isVendorView}
      />

      {/* Inline Review Dialog */}
      {reviewBookingId && (
        <ReviewDialog
          open={!!reviewBookingId}
          onOpenChange={(open) => { if (!open) setReviewBookingId(null); }}
          bookingId={reviewBookingId}
          isVendorView={isVendorView}
          onSuccess={() => {
            setReviewBookingId(null);
            refreshMessages();
          }}
        />
      )}
    </div>
  );
};

// Image attachment component with lazy signed URL loading
function ImageAttachment({ attachment, getSignedUrl }: { attachment: any; getSignedUrl: (bucket: string, path: string) => Promise<string> }) {
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSignedUrl(attachment.bucket, attachment.path).then((signedUrl) => {
      setUrl(signedUrl);
      setLoading(false);
    });
  }, [attachment.bucket, attachment.path, getSignedUrl]);

  if (loading) {
    return (
      <div className="w-48 h-48 flex items-center justify-center bg-muted/50">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <img src={url} alt={attachment.name || 'Image'} className="max-w-full max-h-64 object-contain cursor-pointer" />
    </a>
  );
}

export default ChatThread;
