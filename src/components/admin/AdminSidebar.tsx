import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  ClipboardList,
  Settings,
  BadgeCheck,
  Upload,
  Star,
  X,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { label: 'Overview', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'AI Insights', to: '/admin/insights', icon: Sparkles },
  { label: 'Operations Queue', to: '/admin/operations', icon: ClipboardList },
  { label: 'Verification Queue', to: '/admin/verification-queue', icon: BadgeCheck },
  { label: 'Super Vendors', to: '/admin/super-vendors', icon: Star },
  { label: 'Bulk Upload', to: '/admin/bulk-vendors', icon: Upload },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
];

interface AdminSidebarProps {
  open: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ open, onToggle }: AdminSidebarProps) {
  return (
    <aside
      className={cn(
        'fixed lg:sticky top-0 left-0 z-40 h-screen flex flex-col border-r border-border bg-card transition-all duration-200',
        open ? 'w-60' : 'w-0 lg:w-14 overflow-hidden'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 h-14 border-b border-border shrink-0">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
        {open && <span className="font-semibold text-sm text-foreground truncate">UMCIMBI Admin</span>}
        <Button variant="ghost" size="icon" className="ml-auto shrink-0" onClick={onToggle}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium border-r-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {open && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
