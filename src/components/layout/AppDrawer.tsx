import { useNavigate, useLocation } from 'react-router-dom';
import {
  Calendar, Store, MessageCircle, Receipt, ShoppingBag,
  Settings, LogOut, ChevronRight, Shield, LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface AppDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unreadCount?: number;
}

export function AppDrawer({ open, onOpenChange, unreadCount = 0 }: AppDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, user, signOut, isVendor, isAdmin } = useAuth();
  const { activeRole, canSwitchRole } = useRole();

  const goTo = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const handleLogout = async () => {
    onOpenChange(false);
    await signOut();
    navigate('/onboarding');
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const initials = (profile?.first_name?.[0] || profile?.full_name?.[0] || 'U').toUpperCase();

  const organiserItems = [
    { to: '/events', icon: Calendar, label: 'My Events' },
    { to: '/vendors', icon: Store, label: 'Vendors' },
    { to: '/chats', icon: MessageCircle, label: 'Messages', badge: unreadCount },
    { to: '/quotes', icon: Receipt, label: 'Quotes' },
    { to: '/bookings', icon: ShoppingBag, label: 'Orders' },
  ];

  const vendorItems = [
    { to: '/vendor-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/chats', icon: MessageCircle, label: 'Messages', badge: unreadCount },
    { to: '/vendor-dashboard/bookings', icon: ShoppingBag, label: 'Bookings' },
    { to: '/vendors', icon: Store, label: 'Browse Vendors' },
  ];

  const navItems = activeRole === 'vendor' && canSwitchRole ? vendorItems : organiserItems;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <SheetHeader className="p-5 pb-4">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          {/* User card */}
          <button
            onClick={() => goTo('/settings')}
            className="flex items-center gap-3 text-left w-full tap-highlight-none"
          >
            <Avatar className="h-10 w-10 border border-border">
              <AvatarImage src={(profile as any)?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        </SheetHeader>

        <Separator />

        {/* Nav items */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <button
              key={to}
              onClick={() => goTo(to)}
              className={cn(
                'flex items-center gap-3 w-full px-5 py-3 text-sm font-medium transition-colors tap-highlight-none',
                isActive(to)
                  ? 'text-primary bg-primary/5'
                  : 'text-foreground hover:bg-muted/50'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {badge && badge > 0 ? (
                <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 text-[10px]">
                  {badge}
                </Badge>
              ) : null}
            </button>
          ))}
        </nav>

        <Separator />

        {/* Bottom section */}
        <div className="py-2">
          {isAdmin && (
            <button
              onClick={() => goTo('/admin')}
              className={cn(
                'flex items-center gap-3 w-full px-5 py-3 text-sm font-medium transition-colors tap-highlight-none',
                isActive('/admin') ? 'text-primary bg-primary/5' : 'text-foreground hover:bg-muted/50'
              )}
            >
              <Shield className="h-5 w-5 shrink-0" />
              <span className="flex-1 text-left">Admin</span>
            </button>
          )}

          <button
            onClick={() => goTo('/settings')}
            className={cn(
              'flex items-center gap-3 w-full px-5 py-3 text-sm font-medium transition-colors tap-highlight-none',
              isActive('/settings') ? 'text-primary bg-primary/5' : 'text-foreground hover:bg-muted/50'
            )}
          >
            <Settings className="h-5 w-5 shrink-0" />
            <span className="flex-1 text-left">Settings</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-5 py-3 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors tap-highlight-none"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="flex-1 text-left">Log out</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
