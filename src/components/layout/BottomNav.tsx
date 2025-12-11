import { NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, Store, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConversations } from '@/hooks/useChat';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/events', icon: Calendar, label: 'Events' },
  { to: '/vendors', icon: Store, label: 'Vendors' },
  { to: '/chats', icon: MessageCircle, label: 'Chats' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { conversations } = useConversations();

  // Calculate total unread count
  const totalUnread = conversations.reduce((acc, conv) => acc + (conv.unread_count || 0), 0);

  // Hide bottom nav on onboarding screens
  if (location.pathname.startsWith('/onboarding') || location.pathname.startsWith('/chat/')) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
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
            <div className="relative">
              <Icon className="w-5 h-5" />
              {to === '/chats' && totalUnread > 0 && user && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
                  {totalUnread > 9 ? '9+' : totalUnread}
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
