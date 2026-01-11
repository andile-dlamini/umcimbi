import { useEffect } from 'react';
import { Calendar, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/context/RoleContext';

export function RoleSwitcher() {
  const { activeRole, setActiveRole, canSwitchRole } = useRole();

  // Apply vendor-mode class to document for theme switching
  useEffect(() => {
    if (activeRole === 'vendor' && canSwitchRole) {
      document.documentElement.classList.add('vendor-mode');
    } else {
      document.documentElement.classList.remove('vendor-mode');
    }
    return () => {
      document.documentElement.classList.remove('vendor-mode');
    };
  }, [activeRole, canSwitchRole]);

  if (!canSwitchRole) return null;

  return (
    <div className="flex items-center bg-white/90 dark:bg-gray-800/90 rounded-full p-1 gap-1 shadow-sm">
      <button
        type="button"
        onClick={() => setActiveRole('organiser')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer',
          activeRole === 'organiser'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        )}
      >
        <Calendar className="h-4 w-4" />
        <span className="hidden sm:inline">Organiser</span>
      </button>
      <button
        type="button"
        onClick={() => setActiveRole('vendor')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer',
          activeRole === 'vendor'
            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        )}
      >
        <Store className="h-4 w-4" />
        <span className="hidden sm:inline">Vendor</span>
      </button>
    </div>
  );
}