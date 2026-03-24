import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { useEvents } from '@/hooks/useEvents';
import { useTasks } from '@/hooks/useTasks';
import { Baby, Users, Handshake, Gift, Package, Heart, Sparkles, Flame, Search, MessageSquare, CalendarDays, Plus, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { CeremonyJourney } from '@/components/shared/CeremonyJourney';
import { getEventTypeInfo, EventType } from '@/types/database';
import { learnArticles } from '@/data/learnArticles';
import { differenceInDays, format } from 'date-fns';
import { cn } from '@/lib/utils';

const CEREMONY_TILES: { type: EventType; icon: React.ComponentType<{ className?: string }>; label: string; zuluLabel: string; colorClass: string }[] = [
  { type: 'umembeso', icon: Gift, label: 'Umembeso', zuluLabel: 'Ukupha izipho', colorClass: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  { type: 'umabo', icon: Heart, label: 'Umabo', zuluLabel: 'Umshado wesintu', colorClass: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' },
  { type: 'umemulo', icon: Sparkles, label: 'Umemulo', zuluLabel: 'Ukuqomisa', colorClass: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  { type: 'imbeleko', icon: Baby, label: 'Imbeleko', zuluLabel: 'Ukwethula ingane', colorClass: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400' },
  { type: 'lobola', icon: Handshake, label: 'Lobola', zuluLabel: 'Ilobola', colorClass: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  { type: 'family_introduction', icon: Users, label: 'Family Intro', zuluLabel: 'Ukucela', colorClass: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' },
  { type: 'umbondo', icon: Package, label: 'Umbondo', zuluLabel: 'Ukuletha izipho', colorClass: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
  { type: 'ancestral_ritual', icon: Flame, label: 'Ancestral Ritual', zuluLabel: 'Idlozi', colorClass: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
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

  // Filter out funeral events
  const nonFuneralEvents = events.filter(e => e.type !== 'funeral');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = nonFuneralEvents
    .filter(e => e.date && new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

  const hasEvents = events.length > 0;
  const hasUpcoming = upcomingEvents.length > 0;

  // CeremonyJourney data
  const userEventTypes = events.map(e => e.type);
  const articleIdMap = Object.fromEntries(
    learnArticles.filter(a => a.eventTypeId).map(a => [a.eventTypeId, a.id])
  );
  const handleCeremonyPress = (eventTypeId: string) => {
    const articleId = articleIdMap[eventTypeId];
    if (articleId) navigate('/learn/' + articleId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-safe bg-background">
        <div className="px-4 py-12 max-w-lg mx-auto text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // STATE 1: No events
  if (!hasEvents) {
    return (
      <div className="min-h-screen pb-safe bg-background">
        <div className="px-4 lg:px-12 py-6 max-w-lg lg:max-w-5xl mx-auto animate-fade-in">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 space-y-6 lg:space-y-0">
            {/* Left: greeting + journey + browse link */}
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl lg:text-4xl font-bold text-foreground font-display">Sawubona, {firstName} 👋</h1>
                <p className="text-muted-foreground mt-1 lg:text-lg">What are you planning?</p>
              </div>

              <CeremonyJourney
                userEventTypes={userEventTypes}
                onCeremonyPress={handleCeremonyPress}
              />

              <button
                className="w-full text-center text-sm text-primary hover:underline py-2"
                onClick={() => navigate('/vendors')}
              >
                Not sure? Browse vendors first
              </button>
            </div>

            {/* Right: ceremony tiles grid */}
            <div>
              <div className="grid grid-cols-2 gap-3">
                {CEREMONY_TILES.map(({ type, icon: Icon, label, zuluLabel, colorClass }) => (
                  <Card
                    key={type}
                    className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30 tap-highlight-none"
                    onClick={() => navigate(`/events/new?type=${type}`)}
                  >
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorClass}`}>
                        <Icon className="h-5 w-5" />
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
      </div>
    );
  }

  // STATE 2 & 3: Has events
  const nextEvent = hasUpcoming ? upcomingEvents[0] : null;
  const moreUpcoming = hasUpcoming ? upcomingEvents.slice(1, 3) : [];

  return (
    <div className="min-h-screen pb-safe bg-background">
      <div className="px-4 lg:px-12 py-6 max-w-lg lg:max-w-5xl mx-auto animate-fade-in">
        <div className="lg:grid lg:grid-cols-5 lg:gap-10 space-y-6 lg:space-y-0">
          {/* Left 3/5: greeting, journey, hero card, upcoming */}
          <div className="lg:col-span-3 space-y-6">
            <h1 className="text-2xl lg:text-4xl font-bold text-foreground font-display">Sawubona, {firstName} 👋</h1>

            <CeremonyJourney
              userEventTypes={userEventTypes}
              onCeremonyPress={handleCeremonyPress}
            />

            {/* Hero card: next event or plan-next prompt */}
            {nextEvent ? (
              <NextEventHeroCard eventId={nextEvent.id} event={nextEvent} />
            ) : (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-5 space-y-3 text-center">
                  <Plus className="h-10 w-10 mx-auto text-primary/60" />
                  <h3 className="text-lg font-semibold text-foreground">Plan your next ceremony</h3>
                  <p className="text-sm text-muted-foreground">
                    Your ceremonies are complete. Ready to plan the next one?
                  </p>
                  <Button className="w-full" onClick={() => navigate('/events/new')}>
                    Start Planning
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* More upcoming events */}
            {moreUpcoming.length > 0 && (
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
                        <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-4 w-4 text-accent" />
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
          </div>

          {/* Right 2/5: quick actions + compact ceremony tiles */}
          <div className="lg:col-span-2 space-y-4">
            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-3 lg:flex lg:flex-col lg:gap-2">
              {[
                { label: 'Find Vendors', icon: Search, to: '/vendors' },
                { label: 'My Chats', icon: MessageSquare, to: '/chats' },
                { label: 'My Events', icon: CalendarDays, to: '/events' },
              ].map(({ label, icon: Icon, to }) => (
                <Card
                  key={to}
                  className="cursor-pointer hover:shadow-sm tap-highlight-none lg:hover:bg-muted/60 transition-all duration-200"
                  onClick={() => navigate(to)}
                >
                  <CardContent className="p-3 flex flex-col items-center gap-1.5 lg:flex-row lg:justify-between lg:p-4">
                    <div className="flex flex-col items-center gap-1.5 lg:flex-row lg:gap-3">
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="text-xs lg:text-sm font-medium text-foreground">{label}</span>
                    </div>
                    <ChevronRight className="hidden lg:block h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Compact ceremony tiles */}
            <div className="grid grid-cols-2 gap-3">
              {CEREMONY_TILES.map(({ type, icon: Icon, label, zuluLabel, colorClass }) => (
                <Card
                  key={type}
                  className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30 tap-highlight-none"
                  onClick={() => navigate(`/events/new?type=${type}`)}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorClass}`}>
                      <Icon className="h-5 w-5" />
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
    </div>
  );
}
