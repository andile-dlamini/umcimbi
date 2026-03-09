import { useState, useEffect, useRef } from 'react';
import { Menu, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppDrawer } from '@/components/layout/AppDrawer';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { supabase } from '@/integrations/supabase/client';

export function TopBar() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, isVendor, vendorProfile } = useAuth();
  const { canSwitchRole } = useRole();
  const [unreadCount, setUnreadCount] = useState(0);
  const prevCountRef = useRef(0);

  // Check unread messages
  useEffect(() => {
    if (!user) return;

    const checkUnread = async () => {
      try {
        const { data: clientConvs } = await supabase
          .from('conversations')
          .select('id')
          .eq('user_id', user.id);

        const clientConvIds = clientConvs?.map(c => c.id) || [];
        let total = 0;

        if (clientConvIds.length > 0) {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .in('conversation_id', clientConvIds)
            .eq('sender_type', 'vendor')
            .is('read_at', null);
          total += count || 0;
        }

        if (isVendor && vendorProfile) {
          const { data: vendorConvs } = await supabase
            .from('conversations')
            .select('id')
            .eq('vendor_id', vendorProfile.id);

          const vendorConvIds = vendorConvs?.map(c => c.id) || [];
          if (vendorConvIds.length > 0) {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .in('conversation_id', vendorConvIds)
              .eq('sender_type', 'user')
              .is('read_at', null);
            total += count || 0;
          }
        }

        setUnreadCount(total);
        prevCountRef.current = total;
      } catch (error) {
        console.error('Error checking unread:', error);
      }
    };

    checkUnread();

    const channel = supabase
      .channel(`topbar-unread-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        setTimeout(checkUnread, 200);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, isVendor, vendorProfile]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-sidebar text-sidebar-foreground border-b border-sidebar-border/50">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          {/* Left: hamburger */}
          <Button variant="ghost" size="icon" className="shrink-0 -ml-2 text-sidebar-foreground hover:bg-sidebar-accent/50" onClick={() => setDrawerOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          {/* Center: app name */}
          <h1 className="text-base font-semibold tracking-tight text-sidebar-foreground">
            Isiko
          </h1>

          {/* Right: role switcher or messages shortcut */}
          <div className="flex items-center gap-1">
            {canSwitchRole && <RoleSwitcher />}
            <Button
              variant="ghost"
              size="icon"
              className="relative shrink-0 -mr-2"
              onClick={() => navigate('/chats')}
            >
              <MessageCircle className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 text-[9px] leading-none"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      <AppDrawer open={drawerOpen} onOpenChange={setDrawerOpen} unreadCount={unreadCount} />
    </>
  );
}
