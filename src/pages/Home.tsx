import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Gift, Heart, Handshake, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { useEvents } from '@/hooks/useEvents';
import { EventCard } from '@/components/shared/EventCard';
import { EventType } from '@/types/database';
import VendorCalendarHome from '@/pages/vendor-dashboard/VendorCalendarHome';

const quickStartOptions: { type: EventType; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'umembeso', label: 'Umembeso', description: 'Gift-giving ceremony', icon: Gift },
  { type: 'umabo', label: 'Umabo', description: 'Traditional wedding', icon: Heart },
  { type: 'lobola', label: 'Lobola', description: 'Bridewealth negotiation', icon: Handshake },
  { type: 'umemulo', label: 'Umemulo', description: 'Coming-of-age', icon: Sparkles },
];

export default function Home() {
  const navigate = useNavigate();
  const { profile, isVendor } = useAuth();
  const { activeRole } = useRole();
  const { events, isLoading } = useEvents();

  const upcomingEvents = [...events].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  // Vendor: show calendar home
  if (activeRole === 'vendor' && isVendor) {
    return <VendorCalendarHome />;
  }

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
        {/* Upcoming Ceremonies */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Upcoming
            </h3>
            {upcomingEvents.length > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('/events')}>
                View all <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>

          {isLoading ? (
            <p className="text-muted-foreground text-center py-8 text-sm">Loading...</p>
          ) : upcomingEvents.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <Calendar className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  No ceremonies yet
                </p>
                <Button size="sm" onClick={() => navigate('/events/new')}>
                  <Plus className="h-4 w-4 mr-1" />
                  Plan a ceremony
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.slice(0, 3).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>

        {/* Quick Start */}
        <section>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Quick start
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            {quickStartOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Card 
                  key={option.type}
                  className="cursor-pointer hover:shadow-sm transition-all tap-highlight-none group"
                  onClick={() => navigate(`/events/new?type=${option.type}`)}
                >
                  <CardContent className="p-4">
                    <Icon className="h-5 w-5 text-accent mb-2 group-hover:scale-110 transition-transform" />
                    <h4 className="font-medium text-foreground text-sm">
                      {option.label}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
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
