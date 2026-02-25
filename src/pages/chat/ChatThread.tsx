import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, FileText, Loader2, Image as ImageIcon, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useConversation, useMessages, useSendMessage } from '@/hooks/useChat';
import { useAuth } from '@/context/AuthContext';
import { format, isToday, isYesterday } from 'date-fns';
import { QuoteCard } from '@/components/chat/QuoteCard';
import { MakeQuotationSheet } from '@/components/chat/MakeQuotationSheet';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isVendorView = isVendor && vendorProfile?.id === conversation?.vendor_id;

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

      // Insert message with attachment
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

  const headerTitle = isVendorView
    ? conversation.user_profile?.full_name || conversation.user_profile?.phone_number || 'User'
    : conversation.vendor?.name || 'Vendor';
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

            // Quote Card
            if (messageType === 'quote_card' && metadata) {
              return (
                <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <QuoteCard
                    metadata={metadata}
                    isVendorView={isVendorView}
                    messageId={message.id}
                    onStatusChange={refreshMessages}
                  />
                </div>
              );
            }

            // System message
            if (isSystem) {
              return (
                <div key={message.id} className="flex justify-center">
                  <div className="max-w-[85%] rounded-xl px-4 py-2 bg-muted/50 border border-border">
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
        {/* Vendor actions toolbar */}
        {isVendorView && (
          <div className="flex gap-2 mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuotationSheet(true)}
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
      />

      {/* Chat Details Drawer */}
      <ChatDetailsDrawer
        open={showDetailsDrawer}
        onOpenChange={setShowDetailsDrawer}
        conversationId={conversationId || ''}
        isVendorView={isVendorView}
      />
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
