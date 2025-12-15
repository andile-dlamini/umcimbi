import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { useConversations } from '@/hooks/useChat';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

type ConversationType = ReturnType<typeof useConversations>['conversations'][0];

interface GroupedConversation {
  key: string;
  displayName: string;
  subtitle: string;
  conversations: ConversationType[];
  totalUnread: number;
  latestMessageAt: string | null;
}

const ChatsList = () => {
  const navigate = useNavigate();
  const { isVendor, vendorProfile } = useAuth();
  const { conversations, isLoading } = useConversations();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const getGroupKey = (conv: ConversationType) => {
    if (isVendor && vendorProfile?.id === conv.vendor_id) {
      return `user-${conv.user_id}`;
    }
    return `vendor-${conv.vendor_id}`;
  };

  const getDisplayName = (conv: ConversationType) => {
    if (isVendor && vendorProfile?.id === conv.vendor_id) {
      return conv.user_profile?.full_name || conv.user_profile?.phone_number || 'User';
    }
    return conv.vendor?.name || 'Vendor';
  };

  const getSubtitle = (conv: ConversationType) => {
    if (isVendor && vendorProfile?.id === conv.vendor_id) {
      return conv.user_profile?.email || '';
    }
    return conv.vendor?.category || '';
  };

  const getLastMessageSnippet = (conv: ConversationType) => {
    if (!conv.last_message) return 'No messages yet';
    const content = conv.last_message.content;
    return content.length > 40 ? content.substring(0, 40) + '...' : content;
  };

  const getTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return '';
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  };

  // Group conversations by user/vendor
  const groupedConversations: GroupedConversation[] = (() => {
    const groups = new Map<string, GroupedConversation>();

    conversations.forEach((conv) => {
      const key = getGroupKey(conv);
      
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          displayName: getDisplayName(conv),
          subtitle: getSubtitle(conv),
          conversations: [],
          totalUnread: 0,
          latestMessageAt: null,
        });
      }

      const group = groups.get(key)!;
      group.conversations.push(conv);
      group.totalUnread += conv.unread_count || 0;

      // Track the latest message time across all conversations in the group
      if (conv.last_message_at) {
        if (!group.latestMessageAt || new Date(conv.last_message_at) > new Date(group.latestMessageAt)) {
          group.latestMessageAt = conv.last_message_at;
        }
      }
    });

    // Sort conversations within each group by last message time
    groups.forEach((group) => {
      group.conversations.sort((a, b) => {
        const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return bTime - aTime;
      });
    });

    // Convert to array and sort groups: unread first, then by latest message time
    return Array.from(groups.values()).sort((a, b) => {
      const aUnread = a.totalUnread > 0;
      const bUnread = b.totalUnread > 0;
      if (aUnread && !bUnread) return -1;
      if (!aUnread && bUnread) return 1;
      const aTime = a.latestMessageAt ? new Date(a.latestMessageAt).getTime() : 0;
      const bTime = b.latestMessageAt ? new Date(b.latestMessageAt).getTime() : 0;
      return bTime - aTime;
    });
  })();

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const renderConversationItem = (conv: ConversationType, isSubItem = false) => {
    const hasUnread = (conv.unread_count || 0) > 0;
    return (
      <button
        key={conv.id}
        onClick={() => navigate(`/chat/${conv.id}`)}
        className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left ${
          hasUnread 
            ? 'bg-primary/15 border-primary shadow-md shadow-primary/20' 
            : 'bg-card border-transparent hover:bg-accent/10'
        } ${isSubItem ? 'ml-6' : ''}`}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          hasUnread ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}>
          <MessageCircle className={`h-4 w-4 ${hasUnread ? '' : 'text-muted-foreground'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className={`truncate ${hasUnread ? 'font-bold text-primary' : 'font-medium text-foreground'}`}>
              {conv.event?.name || 'General'}
            </h3>
            <span className={`text-xs shrink-0 ${hasUnread ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
              {getTimeAgo(conv.last_message_at)}
            </span>
          </div>
          <p className={`text-sm truncate ${hasUnread ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
            {getLastMessageSnippet(conv)}
          </p>
        </div>
      </button>
    );
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
        ) : groupedConversations.length === 0 ? (
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
          <div className="space-y-3">
            {groupedConversations.map((group) => {
              const hasMultiple = group.conversations.length > 1;
              const isExpanded = expandedGroups.has(group.key);
              const latestConv = group.conversations[0];
              const hasUnread = group.totalUnread > 0;

              if (!hasMultiple) {
                // Single conversation - render directly
                return (
                  <button
                    key={group.key}
                    onClick={() => navigate(`/chat/${latestConv.id}`)}
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
                          {group.displayName}
                        </h3>
                        <span className={`text-xs shrink-0 ${hasUnread ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                          {getTimeAgo(latestConv.last_message_at)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground capitalize mb-1">
                        {group.subtitle}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${hasUnread ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                          {getLastMessageSnippet(latestConv)}
                        </p>
                      </div>
                      {latestConv.event && (
                        <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] bg-accent/20 text-accent border border-accent/50">
                          {latestConv.event.name}
                        </span>
                      )}
                    </div>
                  </button>
                );
              }

              // Multiple conversations - render as expandable group
              return (
                <div key={group.key} className="space-y-2">
                  <button
                    onClick={() => toggleGroup(group.key)}
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
                          {group.displayName}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs shrink-0 ${hasUnread ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                            {getTimeAgo(group.latestMessageAt)}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground capitalize mb-1">
                        {group.subtitle} • {group.conversations.length} conversations
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${hasUnread ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                          {getLastMessageSnippet(latestConv)}
                        </p>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="space-y-2 pl-4 border-l-2 border-border ml-6">
                      {group.conversations.map((conv) => renderConversationItem(conv, true))}
                    </div>
                  )}
                </div>
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
