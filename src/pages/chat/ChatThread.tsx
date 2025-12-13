import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useConversation, useMessages, useSendMessage } from '@/hooks/useChat';
import { useAuth } from '@/context/AuthContext';
import { format, isToday, isYesterday } from 'date-fns';

const ChatThread = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user, isVendor, vendorProfile } = useAuth();
  const { conversation, isLoading: convLoading } = useConversation(conversationId);
  const { messages, isLoading: msgLoading } = useMessages(conversationId);
  const { sendMessage, isSending } = useSendMessage();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    if (success) {
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    }
    return format(date, 'dd MMM HH:mm');
  };

  const isOwnMessage = (senderId: string | null, senderType: string) => {
    if (!user) return false;
    if (isVendorView) {
      return senderType === 'vendor';
    }
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground truncate">{headerTitle}</h1>
            {headerSubtitle && (
              <p className="text-xs text-muted-foreground capitalize">{headerSubtitle}</p>
            )}
          </div>
        </div>
        
        {/* Event tag */}
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
            <p className="text-muted-foreground text-center">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = isOwnMessage(message.sender_user_id, message.sender_type);
            const isSystem = message.sender_type === 'system';
            
            if (isSystem) {
              return (
                <div key={message.id} className="flex justify-center">
                  <div className="max-w-[85%] rounded-xl px-4 py-2 bg-muted/50 border border-border">
                    <p className="text-sm text-muted-foreground text-center whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 text-center mt-1">
                      {formatMessageTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            }
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isOwn
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}
                  >
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
        <div className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
            disabled={isSending}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatThread;
