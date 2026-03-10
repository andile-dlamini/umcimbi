import { useNavigate } from 'react-router-dom';
import { Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/context/AuthContext';
import { EventCard } from '@/components/shared/EventCard';
import { EventType } from '@/types/database';

const quickStartOptions: { type: EventType; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'umembeso', label: 'Umembeso', description: 'Gift-giving ceremony', icon: Gift },
  { type: 'umabo', label: 'Umabo', description: 'Traditional wedding', icon: Heart },
  { type: 'lobola', label: 'Lobola', description: 'Bridewealth negotiation', icon: Handshake },
  { type: 'umemulo', label: 'Umemulo', description: 'Coming-of-age', icon: Sparkles },
];

export default function EventsList() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { events, isLoading } = useEvents();

  const sortedEvents = [...events].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <div className="min-h-screen pb-safe">
      {/* Greeting */}
      <div className="px-4 pt-6 pb-2 max-w-lg mx-auto">
        <h2 className="text-2xl font-semibold text-foreground tracking-tight">
          Hi, {profile?.first_name || profile?.full_name?.split(' ')[0] || 'there'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Let's plan your ceremony
        </p>
      </div>

      <div className="px-4 py-4 space-y-8 max-w-lg mx-auto">
        {/* New Ceremony Button */}
        <Button className="w-full" size="lg" onClick={() => navigate('/events/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Ceremony
        </Button>

        {/* Upcoming Ceremonies */}
        <section>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Upcoming
          </h3>

          {isLoading ? (
            <p className="text-muted-foreground text-center py-8 text-sm">Loading...</p>
          ) : sortedEvents.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <Calendar className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No ceremonies yet — tap above to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
