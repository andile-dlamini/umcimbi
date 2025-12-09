import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Gift, Calendar, ChevronRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/layout/PageHeader';
import { useEvents } from '@/hooks/useEvents';
import { EventType } from '@/types/database';
import { cn } from '@/lib/utils';

type EventSize = 'small' | 'medium' | 'large';

const sizeOptions = [
  { value: 'small', label: 'Small (up to 80 guests)', count: 80 },
  { value: 'medium', label: 'Medium (80–200 guests)', count: 150 },
  { value: 'large', label: 'Large (200+ guests)', count: 250 },
];

export default function CreateEvent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createEvent } = useEvents();
  
  const preselectedType = searchParams.get('type') as EventType | null;
  
  const [step, setStep] = useState(preselectedType ? 2 : 1);
  const [eventType, setEventType] = useState<EventType | null>(preselectedType);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [size, setSize] = useState<EventSize>('medium');
  const [isCreating, setIsCreating] = useState(false);

  const handleTypeSelect = (type: EventType) => {
    setEventType(type);
    setStep(2);
  };

  const handleCreate = async () => {
    if (!eventType) return;

    setIsCreating(true);
    const selectedSize = sizeOptions.find(s => s.value === size);
    
    const event = await createEvent({
      name: name || `My ${eventType === 'umembeso' ? 'Umembeso' : 'Umabo'}`,
      type: eventType,
      date: date || null,
      location: location || null,
      estimated_guest_count: selectedSize?.count || 150,
      size,
      notes: null,
    });

    setIsCreating(false);
    
    if (event) {
      navigate(`/events/${event.id}`);
    }
  };

  const isValid = eventType && name.length >= 2;

  return (
    <div className="min-h-screen pb-safe bg-background">
      <PageHeader title="Create Ceremony" showBack />

      <div className="px-4 py-6 max-w-lg mx-auto">
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                What are you planning?
              </h2>
              <p className="text-muted-foreground text-sm">
                Select the type of ceremony you want to plan
              </p>
            </div>

            <div className="space-y-3">
              <Card 
                className={cn(
                  'cursor-pointer transition-all tap-highlight-none',
                  'hover:shadow-md hover:border-secondary',
                  eventType === 'umembeso' && 'ring-2 ring-secondary'
                )}
                onClick={() => handleTypeSelect('umembeso')}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <Gift className="h-7 w-7 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Umembeso</h3>
                    <p className="text-sm text-muted-foreground">
                      Gift-giving ceremony to honor the bride's family
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>

              <Card 
                className={cn(
                  'cursor-pointer transition-all tap-highlight-none',
                  'hover:shadow-md hover:border-accent',
                  eventType === 'umabo' && 'ring-2 ring-accent'
                )}
                onClick={() => handleTypeSelect('umabo')}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-7 w-7 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Umabo</h3>
                    <p className="text-sm text-muted-foreground">
                      Traditional Zulu wedding ceremony
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Event details
              </h2>
              <p className="text-muted-foreground text-sm">
                Tell us more about your {eventType === 'umembeso' ? 'Umembeso' : 'Umabo'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Event name or nickname</Label>
                <Input
                  id="name"
                  placeholder={eventType === 'umembeso' ? "e.g., Nomsa's Umembeso" : "e.g., Nomsa & Sibusiso's Umabo"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Event date (optional)</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location (homestead, town)</Label>
                <Input
                  id="location"
                  placeholder="e.g., KwaMashu, Durban"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label>Estimated size</Label>
                <Select value={size} onValueChange={(v) => setSize(v as EventSize)}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full h-12"
              onClick={handleCreate}
              disabled={!isValid || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create ceremony plan'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
