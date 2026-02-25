import { useState } from 'react';
import { CalendarDays, MapPin, Flame, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, subDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export function AdminTopBar() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  return (
    <div className="flex items-center gap-3 overflow-x-auto flex-1">
      {/* Date range */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 text-xs shrink-0">
            <CalendarDays className="h-3.5 w-3.5" />
            {format(dateRange.from, 'dd MMM')} – {format(dateRange.to, 'dd MMM yyyy')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{ from: dateRange.from, to: dateRange.to }}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                setDateRange({ from: range.from, to: range.to });
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {/* Filter placeholders */}
      <Button variant="outline" size="sm" className="gap-2 text-xs shrink-0" disabled>
        <MapPin className="h-3.5 w-3.5" />
        Location
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Soon</Badge>
      </Button>

      <Button variant="outline" size="sm" className="gap-2 text-xs shrink-0" disabled>
        <Flame className="h-3.5 w-3.5" />
        Ceremony
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Soon</Badge>
      </Button>

      <Button variant="outline" size="sm" className="gap-2 text-xs shrink-0" disabled>
        <Store className="h-3.5 w-3.5" />
        Vendor Cat.
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Soon</Badge>
      </Button>
    </div>
  );
}
