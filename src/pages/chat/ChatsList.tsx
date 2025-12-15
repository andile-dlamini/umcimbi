import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { useConversations } from '@/hooks/useChat';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const ChatsList = () => {
  const navigate = useNavigate();
  const { isVendor, vendorProfile } = useAuth();
  const { conversations, isLoading } = useConversations();

  const getDisplayName = (conv: typeof conversations[0]) => {
    if (isVendor && vendorProfile?.id === conv.vendor_id) {
      // Vendor viewing - show user name
      return conv.user_profile?.full_name || conv.user_profile?.phone_number || 'User';
    }
    // User viewing - show vendor name
    return conv.vendor?.name || 'Vendor';
  };

  const getSubtitle = (conv: typeof conversations[0]) => {
    if (isVendor && vendorProfile?.id === conv.vendor_id) {
      return conv.user_profile?.email || '';
    }
    return conv.vendor?.category || '';
  };

  const getLastMessageSnippet = (conv: typeof conversations[0]) => {
    if (!conv.last_message) return 'No messages yet';
    const content = conv.last_message.content;
    return content.length > 40 ? content.substring(0, 40) + '...' : content;
  };

  const getTimeAgo = (conv: typeof conversations[0]) => {
    if (!conv.last_message_at) return '';
    return formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader 
        title="Messages" 
        showBack={false}
      />

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-foreground mb-1">No conversations yet</h3>
            <p className="text-sm text-muted-foreground">
              {isVendor
                ? 'Customers will appear here when they message you'
                : 'Start chatting with vendors from their profile page'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Sort conversations: unread first, then by last message time */}
            {[...conversations]
              .sort((a, b) => {
                const aUnread = (a.unread_count || 0) > 0;
                const bUnread = (b.unread_count || 0) > 0;
                if (aUnread && !bUnread) return -1;
                if (!aUnread && bUnread) return 1;
                // Then sort by last message time
                const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
                const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
                return bTime - aTime;
              })
              .map((conv) => {
              const hasUnread = (conv.unread_count || 0) > 0;
              return (
                <button
                  key={conv.id}
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    hasUnread 
                      ? 'bg-primary/15 border-primary shadow-md shadow-primary/20' 
                      : 'bg-card border-transparent hover:bg-accent/10'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    hasUnread ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <MessageCircle className={`h-5 w-5 ${hasUnread ? '' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`truncate ${hasUnread ? 'font-bold text-primary' : 'font-medium text-foreground'}`}>
                        {getDisplayName(conv)}
                      </h3>
                      <span className={`text-xs shrink-0 ${hasUnread ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                        {getTimeAgo(conv)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground capitalize mb-1">
                      {getSubtitle(conv)}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${hasUnread ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                        {getLastMessageSnippet(conv)}
                      </p>
                      {hasUnread && (
                        <span className="shrink-0 min-w-[22px] h-[22px] px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center animate-pulse">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    {conv.event && (
                      <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] bg-accent/20 text-accent border border-accent/50">
                        {conv.event.name}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default ChatsList;
