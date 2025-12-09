import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Baby, Users, Handshake, Gift, Package, Heart, Sparkles, Flower2, Flame, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/layout/PageHeader';
import { useEvents } from '@/hooks/useEvents';
import { EventType, EVENT_TYPES, getEventTypeInfo } from '@/types/database';
import { cn } from '@/lib/utils';

type EventSize = 'small' | 'medium' | 'large';

const sizeOptions = [
  { value: 'small', label: 'Small (up to 80 guests)', count: 80 },
  { value: 'medium', label: 'Medium (80–200 guests)', count: 150 },
  { value: 'large', label: 'Large (200+ guests)', count: 250 },
];

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
  imbeleko: 'bg-amber-500/20 text-amber-600',
  family_introduction: 'bg-blue-500/20 text-blue-600',
  lobola: 'bg-emerald-500/20 text-emerald-600',
  umembeso: 'bg-secondary/20 text-secondary',
  umbondo: 'bg-purple-500/20 text-purple-600',
  umabo: 'bg-accent/20 text-accent',
  umemulo: 'bg-pink-500/20 text-pink-600',
  funeral: 'bg-slate-500/20 text-slate-600',
  ancestral_ritual: 'bg-orange-500/20 text-orange-600',
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
    const typeInfo = getEventTypeInfo(eventType);
    
    const event = await createEvent({
      name: name || `My ${typeInfo.shortLabel}`,
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
