import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  DollarSign,
  Sparkles,
  ClipboardList,
  Settings,
  BadgeCheck,
  Upload,
  Star,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { label: 'Overview', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Revenue', to: '/admin/revenue', icon: DollarSign },
  { label: 'AI Insights', to: '/admin/insights', icon: Sparkles },
  { label: 'Operations Queue', to: '/admin/operations', icon: ClipboardList },
  { label: 'Verification Queue', to: '/admin/verification-queue', icon: BadgeCheck },
  { label: 'Super Vendors', to: '/admin/super-vendors', icon: Star },
  { label: 'Bulk Upload', to: '/admin/bulk-vendors', icon: Upload },
  { label: 'Waitlist', to: '/admin/waitlist', icon: Clock },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      <div className="flex items-center gap-2 px-4 h-14 border-b border-border shrink-0">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
        {!collapsed && (
          <span className="font-semibold text-sm text-foreground truncate">
            UMCIMBI Admin
          </span>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild tooltip={item.label}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className="hover:bg-muted/50"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
