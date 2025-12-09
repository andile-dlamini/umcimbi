import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ChevronRight, Baby, Users, Handshake, Gift, Package, Heart, Sparkles, Flower2, Flame } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Event, EventType, getEventTypeInfo } from '@/types/database';
import { useTasks } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface EventCardProps {
  event: Event;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Baby,
  Users,
  Handshake,
  Gift,
  Package,
  Heart,
  Sparkles,
  Flower2,
  Flame,
};

const colorMap: Record<EventType, string> = {
  imbeleko: 'bg-accent/20 text-accent border border-accent/50',
  family_introduction: 'bg-accent/20 text-accent border border-accent/50',
  lobola: 'bg-accent/20 text-accent border border-accent/50',
  umembeso: 'bg-accent/20 text-accent border border-accent/50',
  umbondo: 'bg-accent/20 text-accent border border-accent/50',
  umabo: 'bg-accent/20 text-accent border border-accent/50',
  umemulo: 'bg-accent/20 text-accent border border-accent/50',
  funeral: 'bg-accent/20 text-accent border border-accent/50',
  ancestral_ritual: 'bg-accent/20 text-accent border border-accent/50',
};

export function EventCard({ event }: EventCardProps) {
  const navigate = useNavigate();
  const { getProgress } = useTasks(event.id);
  const progress = getProgress();

  const formattedDate = event.date 
    ? format(new Date(event.date), 'dd MMM yyyy')
    : 'Date not set';

  const typeInfo = getEventTypeInfo(event.type);
  const badgeColor = colorMap[event.type] || 'bg-primary text-primary-foreground';

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow tap-highlight-none border-accent/50"
      onClick={() => navigate(`/events/${event.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant="secondary"
                className={cn('text-xs font-medium', badgeColor)}
              >
                {typeInfo.shortLabel}
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
