import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { TopBar } from '@/components/layout/TopBar';

interface AppShellProps {
  children: ReactNode;
}

/** Pages that should NOT show the top bar */
const HIDE_TOPBAR_ROUTES = ['/onboarding', '/auth', '/chat/'];

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();

  const hideTopBar = HIDE_TOPBAR_ROUTES.some(r =>
    location.pathname === r || location.pathname.startsWith(r)
  );

  if (hideTopBar) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
