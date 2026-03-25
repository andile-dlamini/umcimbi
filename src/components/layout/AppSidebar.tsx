import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Calendar, Store, MessageCircle, Receipt, ShoppingBag,
  Settings, LogOut, Shield, LayoutDashboard, ChevronLeft, ChevronRight } from
'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger } from
'@/components/ui/tooltip';

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { profile, user, signOut, isVendor, isAdmin, vendorProfile } = useAuth();
  const { activeRole, canSwitchRole } = useRole();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevCountRef = useRef(0);

  const isPlanner = activeRole !== 'vendor';

  // Unread messages
  useEffect(() => {
    if (!user) return;
    const checkUnread = async () => {
      try {
        const { data: clientConvs } = await supabase.
        from('conversations').select('id').eq('user_id', user.id);
        const clientConvIds = clientConvs?.map((c) => c.id) || [];
        let total = 0;
        if (clientConvIds.length > 0) {
          const { count } = await supabase.from('messages').
          select('*', { count: 'exact', head: true }).
          in('conversation_id', clientConvIds).
          eq('sender_type', 'vendor').is('read_at', null);
          total += count || 0;
        }
        if (isVendor && vendorProfile) {
          const { data: vendorConvs } = await supabase.
          from('conversations').select('id').eq('vendor_id', vendorProfile.id);
          const vendorConvIds = vendorConvs?.map((c) => c.id) || [];
          if (vendorConvIds.length > 0) {
            const { count } = await supabase.from('messages').
            select('*', { count: 'exact', head: true }).
            in('conversation_id', vendorConvIds).
            eq('sender_type', 'user').is('read_at', null);
            total += count || 0;
          }
        }
        setUnreadCount(total);
        prevCountRef.current = total;
      } catch (e) {console.error('Unread check error:', e);}
    };
    checkUnread();
    const channel = supabase.
    channel(`sidebar-unread-${user.id}`).
    on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => setTimeout(checkUnread, 200)).
    subscribe();
    return () => {supabase.removeChannel(channel);};
  }, [user, isVendor, vendorProfile]);

  const goTo = (path: string) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const handleLogout = async () => {
    if (isMobile) setMobileOpen(false);
    await signOut();
    navigate('/onboarding');
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (location.pathname === path) return true;
    if (location.pathname.startsWith(path + '/')) {
      const allPaths = [...navItems.map(i => i.to), ...bottomItems.map(i => i.to)];
      const longerMatch = allPaths.find(p => p !== path && p.length > path.length && location.pathname.startsWith(p));
      return !longerMatch;
    }
    return false;
  };

  const initials = (profile?.first_name?.[0] || profile?.full_name?.[0] || 'U').toUpperCase();

  const organiserItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/events', icon: Calendar, label: 'My Events' },
  { to: '/vendors', icon: Store, label: 'Vendors' },
  { to: '/chats', icon: MessageCircle, label: 'Messages', badge: unreadCount },
  { to: '/quotes', icon: Receipt, label: 'Quotations' },
  { to: '/bookings', icon: ShoppingBag, label: 'Orders' }];

  const vendorItems = [
  { to: '/vendor-dashboard', icon: Home, label: 'Home' },
  { to: '/chats', icon: MessageCircle, label: 'Messages', badge: unreadCount },
  { to: '/vendor-dashboard/quotations', icon: Receipt, label: 'Quotations' },
  { to: '/vendor-dashboard/orders', icon: ShoppingBag, label: 'Orders' }];

  const navItems = activeRole === 'vendor' && canSwitchRole ? vendorItems : organiserItems;

  const bottomItems = [
  ...(isAdmin ? [{ to: '/admin', icon: Shield, label: 'Admin' }] : []),
  { to: '/settings', icon: Settings, label: 'Settings' }];

  // Shared nav content
  function NavContent({ collapsed = false }: {collapsed?: boolean;}) {
    return (
      <div className={cn(
        "flex flex-col h-full",
        isPlanner ? "bg-white text-foreground" : "bg-sidebar text-sidebar-foreground"
      )}>
        {/* Logo / Brand */}
        <div className={cn(
          "shrink-0 border-b flex items-center min-h-[64px]",
          isPlanner ? "border-border" : "border-sidebar-border/50",
          collapsed ? 'justify-center px-2' : 'px-5'
        )}>
          <img
            src="/images/umcimbi-logo.png"
            alt="UMCIMBI"
            className={cn(
              collapsed ? 'h-8' : 'h-10 w-auto',
              isPlanner
                ? 'brightness-0'
                : 'brightness-0 invert'
            )}
          />
        </div>

        {/* User card */}
        <button
          onClick={() => goTo('/settings')}
          className={cn(
            'flex items-center gap-3 tap-highlight-none transition-colors min-h-[52px]',
            isPlanner ? 'hover:bg-muted/50' : 'hover:bg-sidebar-accent/50',
            collapsed ? 'justify-center p-3' : 'px-5 py-3'
          )}>
          <Avatar className={cn('shrink-0', collapsed ? 'h-8 w-8' : 'h-9 w-9')}>
            <AvatarImage src={(profile as any)?.avatar_url || undefined} />
            <AvatarFallback className={cn(
              'text-xs font-semibold',
              isPlanner ? 'bg-muted text-foreground' : 'bg-sidebar-primary/20 text-sidebar-primary'
            )}>
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed &&
          <div className="flex-1 min-w-0 text-left">
              <p className={cn(
                "text-sm font-semibold truncate",
                isPlanner ? "text-foreground" : "text-sidebar-foreground"
              )}>
                {profile?.full_name || profile?.first_name || 'User'}
              </p>
              <p className={cn(
                "text-[11px] truncate",
                isPlanner ? "text-muted-foreground" : "text-sidebar-foreground/50"
              )}>
                {isPlanner ? 'Planner' : 'Vendor'}
              </p>
            </div>
          }
        </button>

        <Separator className={isPlanner ? "bg-border" : "opacity-50"} />

        {/* Main nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, badge }) => {
            const active = isActive(to);
            const button =
            <button
              key={to}
              onClick={() => goTo(to)}
              className={cn(
                'flex items-center gap-3 w-full text-sm font-medium transition-all tap-highlight-none relative',
                collapsed ? 'justify-center px-2 py-3' : 'px-5 py-2.5',
                isPlanner
                  ? active
                    ? 'text-accent bg-accent/[0.08] border-l-2 border-accent'
                    : 'text-foreground/55 hover:text-foreground hover:bg-muted/50'
                  : active
                    ? 'text-sidebar-primary bg-sidebar-primary/15'
                    : 'text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}>
              
                {!isPlanner && active &&
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-sidebar-primary" />
              }
                <Icon className={cn(
                  'shrink-0',
                  collapsed ? 'h-5 w-5' : 'h-[18px] w-[18px]',
                  isPlanner && (active ? 'text-accent' : 'text-foreground/50')
                )} />
                {!collapsed && <span className="flex-1 text-left">{label}</span>}
                {badge && badge > 0 ?
              <Badge variant="destructive" className={cn(
                'text-[10px] leading-none',
                collapsed ? 'absolute top-1 right-1 h-4 min-w-[16px] px-1' : 'h-5 min-w-[20px] px-1.5'
              )}>
                    {badge > 99 ? '99+' : badge}
                  </Badge> :
              null}
              </button>;

            if (collapsed) {
              return (
                <Tooltip key={to} delayDuration={0}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {label}
                  </TooltipContent>
                </Tooltip>);
            }
            return button;
          })}
        </nav>

        <Separator className={isPlanner ? "bg-border" : "opacity-50"} />

        {/* Bottom items */}
        <div className="py-2">
          {bottomItems.map(({ to, icon: Icon, label }) => {
            const active = isActive(to);
            const button =
            <button
              key={to}
              onClick={() => goTo(to)}
              className={cn(
                'flex items-center gap-3 w-full text-sm font-medium transition-colors tap-highlight-none',
                collapsed ? 'justify-center px-2 py-3' : 'px-5 py-2.5',
                isPlanner
                  ? active
                    ? 'text-accent bg-accent/[0.08]'
                    : 'text-foreground/55 hover:text-foreground'
                  : active
                    ? 'text-sidebar-primary bg-sidebar-primary/15'
                    : 'text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}>
                <Icon className={cn('shrink-0', collapsed ? 'h-5 w-5' : 'h-[18px] w-[18px]')} />
                {!collapsed && <span className="flex-1 text-left">{label}</span>}
              </button>;

            if (collapsed) {
              return (
                <Tooltip key={to} delayDuration={0}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>{label}</TooltipContent>
                </Tooltip>);
            }
            return button;
          })}

          {/* Logout */}
          {(() => {
            const button =
            <button
              onClick={handleLogout}
              className={cn(
                'flex items-center gap-3 w-full text-sm font-medium transition-colors tap-highlight-none',
                collapsed ? 'justify-center px-2 py-3' : 'px-5 py-2.5',
                isPlanner ? 'text-destructive/70 hover:text-destructive' : 'text-red-400 hover:bg-sidebar-accent/50'
              )}>
                <LogOut className={cn('shrink-0', collapsed ? 'h-5 w-5' : 'h-[18px] w-[18px]')} />
                {!collapsed && <span className="flex-1 text-left">Log out</span>}
              </button>;

            if (collapsed) {
              return (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>Log out</TooltipContent>
                </Tooltip>);
            }
            return button;
          })()}
        </div>
      </div>);
  }

  // ─── Mobile: icon rail + sheet overlay ───
  if (isMobile) {
    return (
      <>
        <aside className={cn(
          "fixed left-0 top-0 bottom-0 z-40 w-14 border-r flex flex-col",
          isPlanner ? "bg-white border-border" : "bg-sidebar border-sidebar-border"
        )}>
          <NavContent collapsed />
        </aside>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className={cn(
            "w-64 p-0",
            isPlanner ? "bg-white border-border" : "bg-sidebar border-sidebar-border"
          )}>
            <NavContent />
          </SheetContent>
        </Sheet>
      </>);
  }

  // ─── Desktop/Tablet: persistent expanded sidebar ───
  return (
    <aside className={cn(
      "sticky top-0 h-screen w-56 shrink-0 border-r overflow-hidden",
      isPlanner ? "bg-white border-border" : "bg-sidebar border-sidebar-border"
    )}>
      <NavContent />
    </aside>);
}
