import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Gift, Heart, Baby, Users, Handshake, Package, Sparkles, Flower2, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useEvents } from '@/hooks/useEvents';
import { EventCard } from '@/components/shared/EventCard';
import { EventType } from '@/types/database';

const quickStartOptions: { type: EventType; label: string; description: string; icon: React.ComponentType<{ className?: string }>; colorClass: string }[] = [
  { type: 'umembeso', label: 'Umembeso', description: 'Gift-giving ceremony', icon: Gift, colorClass: 'bg-accent/20 text-accent border-accent/50' },
  { type: 'umabo', label: 'Umabo', description: 'Traditional wedding', icon: Heart, colorClass: 'bg-accent/20 text-accent border-accent/50' },
  { type: 'lobola', label: 'Lobola', description: 'Bridewealth negotiation', icon: Handshake, colorClass: 'bg-accent/20 text-accent border-accent/50' },
  { type: 'umemulo', label: 'Umemulo', description: 'Coming-of-age', icon: Sparkles, colorClass: 'bg-accent/20 text-accent border-accent/50' },
];

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

        {/* Quick Start */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">
              Quick start
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/events/new')}>
              View all
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {quickStartOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Card 
                  key={option.type}
                  className={`cursor-pointer hover:shadow-md transition-shadow tap-highlight-none border ${option.colorClass.split(' ').find(c => c.startsWith('border-')) || ''}`}
                  onClick={() => navigate(`/events/new?type=${option.type}`)}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 ${option.colorClass.split(' ').slice(0, 2).join(' ')}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-foreground text-sm">
                      {option.label}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
