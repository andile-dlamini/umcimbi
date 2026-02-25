import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';
import {
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-2 border-b border-border px-4 shrink-0">
            <SidebarTrigger />
            <AdminTopBar />
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
