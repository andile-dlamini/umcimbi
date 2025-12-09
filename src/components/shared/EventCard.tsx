import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Event } from '@/types/database';
import { useTasks } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const navigate = useNavigate();
  const { getProgress } = useTasks(event.id);
  const progress = getProgress();

  const formattedDate = event.date 
    ? format(new Date(event.date), 'dd MMM yyyy')
    : 'Date not set';

  const isUmembeso = event.type === 'umembeso';

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-shweshwe-lg transition-all tap-highlight-none overflow-hidden",
        "border-l-4",
        isUmembeso ? "border-l-secondary" : "border-l-primary"
      )}
      onClick={() => navigate(`/events/${event.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={isUmembeso ? "umembeso" : "umabo"}>
                {isUmembeso ? 'Umembeso' : 'Umabo'}
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
          
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
            isUmembeso ? "bg-secondary/10" : "bg-primary/10"
          )}>
            <ChevronRight className={cn(
              "h-5 w-5",
              isUmembeso ? "text-secondary" : "text-primary"
            )} />
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}