import { useNavigate } from 'react-router-dom';
import { Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useApp } from '@/context/AppContext';
import { EventCard } from '@/components/shared/EventCard';
import { PageHeader } from '@/components/layout/PageHeader';

export default function EventsList() {
  const navigate = useNavigate();
  const { events } = useApp();

  const sortedEvents = [...events].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <div className="min-h-screen pb-safe">
      <PageHeader 
        title="My Events" 
        rightAction={
          <Button size="sm" onClick={() => navigate('/events/new')}>
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        }
      />

      <div className="px-4 py-6 max-w-lg mx-auto">
        {sortedEvents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold text-foreground mb-2">No ceremonies yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start planning your first ceremony
              </p>
              <Button onClick={() => navigate('/events/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create event
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}