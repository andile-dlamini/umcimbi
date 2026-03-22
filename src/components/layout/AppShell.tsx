import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { InstallPrompt } from '@/components/shared/InstallPrompt';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppShellProps {
  children: ReactNode;
}

/** Pages that should NOT show the sidebar */
const HIDE_NAV_ROUTES = ['/onboarding', '/auth', '/chat/'];

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const isMobile = useIsMobile();

  const hideNav = HIDE_NAV_ROUTES.some(r =>
    location.pathname === r || location.pathname.startsWith(r)
  );

  if (hideNav) return <>{children}</>;

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <main className={`flex-1 min-w-0 ${isMobile ? 'ml-14' : ''}`}>
        {children}
      </main>
    </div>
  );
}
