import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Baby, Users, Handshake, Gift, Package, Heart, Sparkles, Flower2, Flame, ChevronRight, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PageHeader } from '@/components/layout/PageHeader';
import { useEvents } from '@/hooks/useEvents';
import { EventType, EVENT_TYPES, getEventTypeInfo } from '@/types/database';
import { getArticleByEventType } from '@/data/learnArticles';
import { cn } from '@/lib/utils';
import { z } from 'zod';

const eventSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  location: z.string().max(200, 'Location must be less than 200 characters').optional(),
});

// Get today's date in YYYY-MM-DD format for date validation
const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};


const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Baby,
  Users,
  Handshake,
  Gift,
  Package,
  Heart,
  Sparkles,
  Flower2,
  Flame,
};

const colorMap: Record<EventType, string> = {
  imbeleko: 'bg-accent/20 text-accent',
  family_introduction: 'bg-accent/20 text-accent',
  lobola: 'bg-accent/20 text-accent',
  umembeso: 'bg-accent/20 text-accent',
  umbondo: 'bg-accent/20 text-accent',
  umabo: 'bg-accent/20 text-accent',
  umemulo: 'bg-accent/20 text-accent',
  funeral: 'bg-accent/20 text-accent',
  ancestral_ritual: 'bg-accent/20 text-accent',
};

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
  const [guestCount, setGuestCount] = useState('50');
  const [isCreating, setIsCreating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleTypeSelect = (type: EventType) => {
    setEventType(type);
    setStep(2);
  };

  const handleCreate = async () => {
    if (!eventType) return;

    const errors: Record<string, string> = {};

    // Validate inputs
    const result = eventSchema.safeParse({
      name: name.trim(),
      location: location.trim() || undefined,
    });

    if (!result.success) {
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
    }

    // Validate date - must be today or in the future
    if (date) {
      const today = getTodayString();
      if (date < today) {
        errors.date = 'Event date must be today or in the future';
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setIsCreating(true);
    const typeInfo = getEventTypeInfo(eventType);
    const parsedCount = parseInt(guestCount) || 50;
    const sizeLabel = parsedCount <= 80 ? 'small' : parsedCount <= 200 ? 'medium' : 'large';
    
    const event = await createEvent({
      name: result.data?.name || name.trim() || `My ${typeInfo.shortLabel}`,
      type: eventType,
      date: date || null,
      location: result.data?.location || location.trim() || null,
      estimated_guest_count: parsedCount,
      size: sizeLabel,
      notes: null,
    });

    setIsCreating(false);
    
    if (event) {
      navigate(`/events/${event.id}`);
    }
  };

  const isValid = eventType && name.length >= 2;

  const selectedTypeInfo = eventType ? getEventTypeInfo(eventType) : null;

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
              {EVENT_TYPES.map((typeInfo) => {
                const Icon = iconMap[typeInfo.icon] || Gift;
                const colorClass = colorMap[typeInfo.id];
                
                return (
                  <Card 
                    key={typeInfo.id}
                    className={cn(
                      'cursor-pointer transition-all tap-highlight-none',
                      'hover:shadow-md hover:border-primary/50',
                      eventType === typeInfo.id && 'ring-2 ring-primary'
                    )}
                    onClick={() => handleTypeSelect(typeInfo.id)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', colorClass)}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm">
                          {typeInfo.shortLabel}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {typeInfo.description}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && selectedTypeInfo && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Event details
              </h2>
              <p className="text-muted-foreground text-sm">
                Tell us more about your {selectedTypeInfo.shortLabel}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Event name or nickname</Label>
                <Input
                  id="name"
                  placeholder={`e.g., ${selectedTypeInfo.shortLabel} for ${new Date().getFullYear()}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  className={cn('h-12', validationErrors.name && 'border-destructive')}
                />
                {validationErrors.name && (
                  <p className="text-xs text-destructive">{validationErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Event date (optional)</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    // Clear date error when user changes value
                    if (validationErrors.date) {
                      setValidationErrors(prev => {
                        const { date, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                  min={getTodayString()}
                  className={cn('h-12', validationErrors.date && 'border-destructive')}
                />
                {validationErrors.date && (
                  <p className="text-xs text-destructive">{validationErrors.date}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Event Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., 123 Main Road, KwaMashu, Durban"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  maxLength={200}
                  className={cn('h-12', validationErrors.location && 'border-destructive')}
                />
                <p className="text-xs text-muted-foreground">
                  Enter a full address to calculate vendor distances
                </p>
                {validationErrors.location && (
                  <p className="text-xs text-destructive">{validationErrors.location}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestCount">Estimated number of guests</Label>
                <Input
                  id="guestCount"
                  type="number"
                  placeholder="e.g., 100"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  min={1}
                  max={10000}
                  className="h-12"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 h-12"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                size="lg"
                className="flex-1 h-12"
                onClick={handleCreate}
                disabled={!isValid || isCreating}
              >
                {isCreating ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
