import { Calendar, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/context/RoleContext';

export function RoleSwitcher() {
  const { activeRole, setActiveRole, canSwitchRole } = useRole();

  if (!canSwitchRole) return null;

  return (
    <div className="flex items-center bg-muted rounded-full p-1 gap-1">
      <button
        onClick={() => setActiveRole('organiser')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
          activeRole === 'organiser'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Calendar className="h-4 w-4" />
        <span className="hidden sm:inline">Organiser</span>
      </button>
      <button
        onClick={() => setActiveRole('vendor')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
          activeRole === 'vendor'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Store className="h-4 w-4" />
        <span className="hidden sm:inline">Vendor</span>
      </button>
    </div>
  );
}