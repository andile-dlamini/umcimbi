import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Wallet, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { useEvents } from '@/hooks/useEvents';
import { useTasks } from '@/hooks/useTasks';
import { useBudget } from '@/hooks/useBudget';
import { TasksTab } from './tabs/TasksTab';
import { BudgetTab } from './tabs/BudgetTab';
import { GuestsTab } from './tabs/GuestsTab';
import { VendorsTab } from './tabs/VendorsTab';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function EventDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, updateEvent, isLoading } = useEvents();
  const { getProgress } = useTasks(id);
  const { getSummary } = useBudget(id);
  
  const event = events.find(e => e.id === id);
  const [activeTab, setActiveTab] = useState('overview');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (event) {
      setNotes(event.notes || '');
    }
  }, [event]);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (event) {
      updateEvent(event.id, { notes: value });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-safe">
        <PageHeader title="Loading..." showBack />
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen pb-safe">
        <PageHeader title="Event not found" showBack />
        <div className="px-4 py-12 text-center">
          <p className="text-muted-foreground">This event doesn't exist.</p>
          <Button className="mt-4" onClick={() => navigate('/events')}>
            Go to events
          </Button>
        </div>
      </div>
    );
  }

  const progress = getProgress();
  const budget = getSummary();

  const formattedDate = event.date 
    ? format(new Date(event.date), 'dd MMMM yyyy')
    : 'Date not set';

  return (
    <div className="min-h-screen pb-safe">
      <PageHeader title={event.name} showBack />

      {/* Hero Card */}
      <div className={cn(
        'px-4 py-5',
        event.type === 'umembeso' ? 'bg-secondary/10' : 'bg-accent/10'
      )}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-start justify-between mb-3">
            <Badge 
              className={cn(
                event.type === 'umembeso' 
                  ? 'bg-secondary text-secondary-foreground' 
                  : 'bg-accent text-accent-foreground'
              )}
            >
              {event.type === 'umembeso' ? 'Umembeso' : 'Umabo'}
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/events/${event.id}/ceremony-mode`)}
            >
              <Play className="h-4 w-4 mr-1" />
              Ceremony Mode
            </Button>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            )}
          </div>

          <ProgressBar value={progress} showLabel />
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-lg mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky top-14 z-30 bg-background border-b border-border">
            <TabsList className="w-full h-auto p-0 bg-transparent rounded-none">
              <TabsTrigger 
                value="overview" 
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="tasks"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
              >
                Tasks
              </TabsTrigger>
              <TabsTrigger 
                value="budget"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
              >
                Budget
              </TabsTrigger>
              <TabsTrigger 
                value="guests"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
              >
                Guests
              </TabsTrigger>
              <TabsTrigger 
                value="vendors"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
              >
                Vendors
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="px-4 py-6 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-xs">Est. Guests</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {event.estimated_guest_count}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Wallet className="h-4 w-4" />
                    <span className="text-xs">Budget</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    R{budget.planned.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Notes */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Event Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add notes about your ceremony..."
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="px-4 py-6">
            <TasksTab eventId={event.id} />
          </TabsContent>

          <TabsContent value="budget" className="px-4 py-6">
            <BudgetTab eventId={event.id} />
          </TabsContent>

          <TabsContent value="guests" className="px-4 py-6">
            <GuestsTab eventId={event.id} estimatedCount={event.estimated_guest_count} />
          </TabsContent>

          <TabsContent value="vendors" className="px-4 py-6">
            <VendorsTab eventId={event.id} location={event.location || ''} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
