import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useEvents } from '@/hooks/useEvents';
import { EventCard } from '@/components/shared/EventCard';

export default function Home() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { events, isLoading } = useEvents();

  const upcomingEvents = [...events].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <div className="min-h-screen pb-safe">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-8 pb-6">
        <h1 className="text-2xl font-bold">
          Hi, {profile?.full_name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-primary-foreground/80 mt-1">
          Let's plan your ceremony
        </p>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        {/* Upcoming Ceremonies */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Upcoming ceremonies
          </h2>

          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : upcomingEvents.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">
                  You have no ceremonies yet
                </p>
                <Button onClick={() => navigate('/events/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Plan a ceremony
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>

        {/* Start New */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Start new
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow tap-highlight-none border-secondary/50"
              onClick={() => navigate('/events/new?type=umembeso')}
            >
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-secondary/20 flex items-center justify-center mb-3">
                  <Gift className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">
                  Plan Umembeso
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Gift-giving ceremony
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow tap-highlight-none border-accent/50"
              onClick={() => navigate('/events/new?type=umabo')}
            >
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-accent/20 flex items-center justify-center mb-3">
                  <Calendar className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">
                  Plan Umabo
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Traditional wedding
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
