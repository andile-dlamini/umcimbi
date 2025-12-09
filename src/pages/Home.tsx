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
      {/* Header with Shweshwe Pattern */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 shweshwe-pattern-red opacity-60" />
        <div className="relative bg-gradient-to-b from-primary/90 to-primary text-primary-foreground px-4 pt-10 pb-8">
          <h1 className="text-2xl font-bold">
            Hi, {profile?.full_name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-primary-foreground/80 mt-1">
            Let's plan your ceremony
          </p>
        </div>
        {/* Decorative divider */}
        <div className="divider-shweshwe" />
      </div>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        {/* Upcoming Ceremonies */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Upcoming ceremonies
          </h2>

          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : upcomingEvents.length === 0 ? (
            <Card className="border-dashed border-2 border-muted bg-muted/30">
              <CardContent className="py-8 text-center">
                <div className="w-16 h-16 mx-auto rounded-full shweshwe-pattern-teal flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 text-secondary" />
                </div>
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
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            Start new
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            <Card 
              className="cursor-pointer hover:shadow-shweshwe-lg transition-all tap-highlight-none border-secondary/30 group overflow-hidden"
              onClick={() => navigate('/events/new?type=umembeso')}
            >
              <CardContent className="p-4 text-center relative">
                <div className="absolute inset-0 shweshwe-pattern-teal opacity-20 group-hover:opacity-30 transition-opacity" />
                <div className="relative">
                  <div className="w-14 h-14 mx-auto rounded-full bg-secondary/20 flex items-center justify-center mb-3 ring-2 ring-secondary/30">
                    <Gift className="h-7 w-7 text-secondary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">
                    Plan Umembeso
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Gift-giving ceremony
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-shweshwe-lg transition-all tap-highlight-none border-primary/30 group overflow-hidden"
              onClick={() => navigate('/events/new?type=umabo')}
            >
              <CardContent className="p-4 text-center relative">
                <div className="absolute inset-0 shweshwe-pattern-red opacity-20 group-hover:opacity-30 transition-opacity" />
                <div className="relative">
                  <div className="w-14 h-14 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-3 ring-2 ring-primary/30">
                    <Calendar className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">
                    Plan Umabo
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Traditional wedding
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}