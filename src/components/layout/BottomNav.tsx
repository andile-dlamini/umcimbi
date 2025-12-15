import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Store, MessageCircle, BookOpen, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export function BottomNav() {
  const location = useLocation();
  const { user, isVendor, vendorProfile } = useAuth();
  const [hasUnread, setHasUnread] = useState(false);

  // Check if there are any unread messages
  useEffect(() => {
    if (!user) return;

    const checkUnread = async () => {
      try {
        // Get conversations where user is the client
        const { data: clientConvs } = await supabase
          .from('conversations')
          .select('id')
          .eq('user_id', user.id);

        const clientConvIds = clientConvs?.map(c => c.id) || [];

        // Check for unread vendor messages
        if (clientConvIds.length > 0) {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .in('conversation_id', clientConvIds)
            .eq('sender_type', 'vendor')
            .is('read_at', null);

          if ((count || 0) > 0) {
            setHasUnread(true);
            return;
          }
        }

        // If vendor, check those conversations too
        let vendorConvIds: string[] = [];
        if (isVendor && vendorProfile) {
          const { data: vendorConvs } = await supabase
            .from('conversations')
            .select('id')
            .eq('vendor_id', vendorProfile.id);

          vendorConvIds = vendorConvs?.map(c => c.id) || [];

          if (vendorConvIds.length > 0) {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .in('conversation_id', vendorConvIds)
              .eq('sender_type', 'user')
              .is('read_at', null);

            if ((count || 0) > 0) {
              setHasUnread(true);
              return;
            }
          }
        }

        // Check system messages
        const allConvIds = [...new Set([...clientConvIds, ...vendorConvIds])];
        if (allConvIds.length > 0) {
          const { count: systemCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .in('conversation_id', allConvIds)
            .eq('sender_type', 'system')
            .is('read_at', null)
            .neq('sender_user_id', user.id);

          const { count: nullSenderCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .in('conversation_id', allConvIds)
            .eq('sender_type', 'system')
            .is('read_at', null)
            .is('sender_user_id', null);

          if ((systemCount || 0) + (nullSenderCount || 0) > 0) {
            setHasUnread(true);
            return;
          }
        }

        setHasUnread(false);
      } catch (error) {
        console.error('Error checking unread:', error);
      }
    };

    checkUnread();

    // Set up real-time subscription for new messages
    const channelName = `unread-messages-${user.id}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        setTimeout(checkUnread, 100);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => {
        setTimeout(checkUnread, 100);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isVendor, vendorProfile, location.pathname]);

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/vendors', icon: Store, label: 'Vendors' },
    { to: '/chats', icon: MessageCircle, label: 'Chats', showDot: hasUnread },
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
        {navItems.map(({ to, icon: Icon, label, showDot }) => (
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
              {showDot && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
              )}
            </div>
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}