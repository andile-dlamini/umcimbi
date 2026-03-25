import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { useEvents } from '@/hooks/useEvents';
import { useTasks } from '@/hooks/useTasks';
import { Baby, Users, Handshake, Gift, Package, Heart, Sparkles, Flame, Search, MessageSquare, CalendarDays, Plus, ChevronRight, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { CeremonyJourney } from '@/components/shared/CeremonyJourney';
import { getEventTypeInfo, EventType } from '@/types/database';
import { learnArticles } from '@/data/learnArticles';
import { differenceInDays, format } from 'date-fns';
import { cn } from '@/lib/utils';

const CEREMONY_TILES: { type: EventType; icon: React.ComponentType<{ className?: string }>; label: string; zuluLabel: string }[] = [
  { type: 'umembeso', icon: Gift, label: 'Umembeso', zuluLabel: 'Ukupha izipho' },
  { type: 'umabo', icon: Heart, label: 'Umabo', zuluLabel: 'Umshado wesintu' },
  { type: 'umemulo', icon: Sparkles, label: 'Umemulo', zuluLabel: 'Ukuqomisa' },
  { type: 'imbeleko', icon: Baby, label: 'Imbeleko', zuluLabel: 'Ukwethula ingane' },
  { type: 'lobola', icon: Handshake, label: 'Lobola', zuluLabel: 'Ilobola' },
  { type: 'family_introduction', icon: Users, label: 'Family Intro', zuluLabel: 'Ukucela' },
  { type: 'umbondo', icon: Package, label: 'Umbondo', zuluLabel: 'Ukuletha izipho' },
  { type: 'ancestral_ritual', icon: Flame, label: 'Ancestral Ritual', zuluLabel: 'Idlozi' },
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Baby, Users, Handshake, Gift, Package, Heart, Sparkles, Flame,
};

function NextEventHeroCard({ eventId, event }: { eventId: string; event: { id: string; name: string; type: EventType; date: string | null } }) {
  const navigate = useNavigate();
  const { getProgress } = useTasks(eventId);
  const progress = getProgress();
  const typeInfo = getEventTypeInfo(event.type);
  const Icon = iconMap[typeInfo.icon] || Gift;
  const daysAway = event.date ? differenceInDays(new Date(event.date), new Date()) : null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Badge className="bg-accent text-accent-foreground">
              <Icon className="h-3 w-3 mr-1" />
              {typeInfo.shortLabel}
            </Badge>
            <h3 className="text-lg font-semibold text-foreground">{event.name}</h3>
            {daysAway !== null && daysAway >= 0 && (
              <p className="text-sm text-muted-foreground">
                {daysAway === 0 ? 'Today!' : `${daysAway} day${daysAway !== 1 ? 's' : ''} away`}
              </p>
            )}
          </div>
        </div>
        <ProgressBar value={progress} showLabel />
        <Button className="w-full" onClick={() => navigate(`/events/${event.id}`)}>
          View Event
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { isVendor, profile } = useAuth();
  const { activeRole } = useRole();
  const navigate = useNavigate();
  const { events, isLoading } = useEvents();

  if (activeRole === 'vendor' && isVendor) {
    return <Navigate to="/vendor-dashboard" replace />;
  }

  const firstName = profile?.first_name || 'there';

  const nonFuneralEvents = events.filter(e => e.type !== 'funeral');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = nonFuneralEvents
    .filter(e => e.date && new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

  const hasEvents = events.length > 0;
  const hasUpcoming = upcomingEvents.length > 0;

  const userEventTypes = events.map(e => e.type);
  const articleIdMap = Object.fromEntries(
    learnArticles.filter(a => a.eventTypeId).map(a => [a.eventTypeId, a.id])
  );
  const handleCeremonyPress = (eventTypeId: string) => {
    const articleId = articleIdMap[eventTypeId];
    if (articleId) navigate('/learn/' + articleId);
  };

  const nextEvent = hasUpcoming ? upcomingEvents[0] : null;
  const moreUpcoming = hasUpcoming ? upcomingEvents.slice(1, 3) : [];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-safe bg-background">
      {/* Topbar */}
      <div className="min-h-[109px] border-b border-border bg-background/80 backdrop-blur-sm flex items-center px-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold font-display text-foreground">
            Sawubona,{' '}{firstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            What are you planning today?
          </p>
        </div>
        <Button
          onClick={() => navigate('/events/new')}
          className="hidden sm:flex items-center gap-2 bg-accent hover:bg-accent/90 text-white border-0 shrink-0"
        >
          <Plus className="h-4 w-4" />
          New Ceremony
        </Button>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* CeremonyJourney — always shown */}
        <Card>
          <CardContent className="p-5">
            <CeremonyJourney
              userEventTypes={userEventTypes}
              onCeremonyPress={handleCeremonyPress}
            />
          </CardContent>
        </Card>

        {/* Event content — shown when has events */}
        {hasEvents && nextEvent && (
          <NextEventHeroCard eventId={nextEvent.id} event={nextEvent} />
        )}

        {hasEvents && moreUpcoming.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Upcoming</h2>
            {moreUpcoming.map(event => {
              const typeInfo = getEventTypeInfo(event.type);
              const Icon = iconMap[typeInfo.icon] || Gift;
              return (
                <Card
                  key={event.id}
                  className="cursor-pointer hover:shadow-sm tap-highlight-none"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-foreground/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{event.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.date ? format(new Date(event.date), 'dd MMM yyyy') : 'Date not set'}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Ceremony tiles — always shown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold font-display text-foreground">
              {hasEvents ? 'Plan another ceremony' : 'Choose a ceremony to plan'}
            </h2>
            <button
              className="text-sm text-accent hover:underline font-medium"
              onClick={() => navigate('/vendors')}
            >
              Browse vendors →
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {CEREMONY_TILES.map(({ type, icon: Icon, label, zuluLabel }) => (
              <Card
                key={type}
                className="cursor-pointer transition-all hover:shadow-md hover:border-accent/30 tap-highlight-none"
                onClick={() => navigate('/events/new?type=' + type)}
              >
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center">
                    <Icon className="h-5 w-5 text-foreground/60" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{zuluLabel}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
