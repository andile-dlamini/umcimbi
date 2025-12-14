import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Store, MessageCircle, BookOpen, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export function BottomNav() {
  const location = useLocation();
  const { user, isVendor, vendorProfile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread message count
  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {
        // Get conversations for this user
        let conversationIds: string[] = [];
        
        // Get conversations where user is the client
        const { data: userConvs } = await supabase
          .from('conversations')
          .select('id, vendor_id')
          .eq('user_id', user.id);
        
        if (userConvs) {
          conversationIds = [...userConvs.map(c => c.id)];
        }

        // If vendor, also get those conversations
        if (isVendor && vendorProfile) {
          const { data: vendorConvs } = await supabase
            .from('conversations')
            .select('id')
            .eq('vendor_id', vendorProfile.id);
          
          if (vendorConvs) {
            conversationIds = [...conversationIds, ...vendorConvs.map(c => c.id)];
          }
        }

        if (conversationIds.length === 0) {
          setUnreadCount(0);
          return;
        }

        // Count unread messages in these conversations
        let totalUnread = 0;

        for (const convId of conversationIds) {
          const { data: conv } = await supabase
            .from('conversations')
            .select('vendor_id, user_id')
            .eq('id', convId)
            .single();

          if (!conv) continue;

          const isVendorView = isVendor && vendorProfile?.id === conv.vendor_id;
          
          // For vendor view: count user messages
          // For client view: count vendor messages
          // System messages: count only if not sent by current user
          const regularSenderType: 'user' | 'vendor' = isVendorView ? 'user' : 'vendor';

          // Count regular messages (user/vendor)
          const { count: regularCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', convId)
            .eq('sender_type', regularSenderType)
            .is('read_at', null);

          // Count system messages NOT sent by current user
          const { count: systemCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', convId)
            .eq('sender_type', 'system')
            .neq('sender_user_id', user.id)
            .is('read_at', null);

          totalUnread += (regularCount || 0) + (systemCount || 0);
        }

        setUnreadCount(totalUnread);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isVendor, vendorProfile]);

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/vendors', icon: Store, label: 'Vendors' },
    { to: '/chats', icon: MessageCircle, label: 'Chats', badge: unreadCount },
    { to: '/learn', icon: BookOpen, label: 'Learn' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  // Hide bottom nav on onboarding screens and chat thread
  if (location.pathname.startsWith('/onboarding') || location.pathname.startsWith('/chat/')) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center w-full h-full gap-1 tap-highlight-none transition-colors relative',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            <div className="relative flex items-center justify-center">
              <Icon className="w-5 h-5" />
              {typeof badge === 'number' && badge > 0 && (
                <span className="absolute -top-2 -right-2.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}