import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Event } from '@/types';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const navigate = useNavigate();
  const { getEventProgress } = useApp();
  const progress = getEventProgress(event.id);

  const formattedDate = event.date 
    ? format(new Date(event.date), 'dd MMM yyyy')
    : 'Date not set';

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow tap-highlight-none"
      onClick={() => navigate(`/events/${event.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant="secondary"
                className={cn(
                  'text-xs font-medium',
                  event.type === 'umembeso' 
                    ? 'bg-secondary text-secondary-foreground' 
                    : 'bg-accent text-accent-foreground'
                )}
              >
                {event.type === 'umembeso' ? 'Umembeso' : 'Umabo'}
              </Badge>
            </div>
            
            <h3 className="font-semibold text-foreground truncate mb-2">
              {event.name}
            </h3>
            
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formattedDate}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
            </div>
          </div>
          
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
        </div>
        
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}