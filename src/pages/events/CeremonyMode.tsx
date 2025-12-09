import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Phone, Check, Clock, Users, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useEvents, useEventVendors } from '@/hooks/useEvents';
import { useVendors } from '@/hooks/useVendors';
import { cn } from '@/lib/utils';

interface ProgramItem {
  id: string;
  time: string;
  title: string;
  completed: boolean;
}

const umembesoProgramTemplate: Omit<ProgramItem, 'completed'>[] = [
  { id: '1', time: '08:00', title: 'Bride\'s family prepares homestead' },
  { id: '2', time: '09:00', title: 'Groom\'s delegation arrives' },
  { id: '3', time: '09:30', title: 'Formal greetings & introductions' },
  { id: '4', time: '10:00', title: 'Gift presentation ceremony begins' },
  { id: '5', time: '11:00', title: 'Bride\'s family receives gifts' },
  { id: '6', time: '12:00', title: 'Lunch served to guests' },
  { id: '7', time: '14:00', title: 'Traditional songs & dancing' },
  { id: '8', time: '16:00', title: 'Closing ceremony & departure' },
];

const umaboProgramTemplate: Omit<ProgramItem, 'completed'>[] = [
  { id: '1', time: '05:00', title: 'Bride wakes for ukucimela (early morning rituals)' },
  { id: '2', time: '06:00', title: 'Slaughtering of livestock' },
  { id: '3', time: '08:00', title: 'Bride\'s preparation & dressing' },
  { id: '4', time: '09:00', title: 'Guests arrive & are seated' },
  { id: '5', time: '10:00', title: 'Bride\'s entrance ceremony' },
  { id: '6', time: '11:00', title: 'Traditional rituals & blessings' },
  { id: '7', time: '12:30', title: 'Feast begins - traditional meal served' },
  { id: '8', time: '14:00', title: 'Gift presentations' },
  { id: '9', time: '15:00', title: 'Traditional dancing & celebrations' },
  { id: '10', time: '17:00', title: 'Bride officially welcomed to groom\'s family' },
  { id: '11', time: '18:00', title: 'Evening celebrations continue' },
];

export default function CeremonyMode() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, updateEvent } = useEvents();
  const { eventVendors  } = useEventVendors(id);
  const { vendors } = useVendors();
  
  const event = events.find(e => e.id === id);
  
  const selectedVendors = vendors.filter(v => 
    eventVendors.some(ev => ev.vendor_id === v.id)
  );

  const [program, setProgram] = useState<ProgramItem[]>(() => {
    const template = event?.type === 'umembeso' 
      ? umembesoProgramTemplate 
      : umaboProgramTemplate;
    return template.map(item => ({ ...item, completed: false }));
  });
  
  const [notes, setNotes] = useState(event?.notes || '');

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Event not found</p>
      </div>
    );
  }

  const toggleProgramItem = (itemId: string) => {
    setProgram(prev => prev.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleSaveNotes = () => {
    updateEvent(event.id, { notes });
  };

  const completedCount = program.filter(p => p.completed).length;
  const progress = Math.round((completedCount / program.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/20 to-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg">{event.name}</h1>
          <p className="text-sm text-primary-foreground/80">Ceremony Mode</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          className="text-primary-foreground hover:text-primary-foreground/80"
          onClick={() => navigate(`/events/${event.id}`)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-3 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Day Progress</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Program */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Day Program
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {program.map((item, index) => (
              <div 
                key={item.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg transition-colors',
                  item.completed ? 'bg-success/10' : 'bg-muted/50'
                )}
              >
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={() => toggleProgramItem(item.id)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono">
                      {item.time}
                    </Badge>
                    {item.completed && (
                      <Check className="h-4 w-4 text-success" />
                    )}
                  </div>
                  <p className={cn(
                    'text-sm mt-1',
                    item.completed && 'line-through text-muted-foreground'
                  )}>
                    {item.title}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Vendors Quick Access */}
        {selectedVendors.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5" />
                Quick Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {selectedVendors.map(vendor => (
                <div 
                  key={vendor.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{vendor.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{vendor.category}</p>
                  </div>
                  {vendor.phone_number && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={`tel:${vendor.phone_number}`}>
                        <Phone className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Add notes for today..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleSaveNotes}
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
