import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Phone, Check, Clock, Users, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useApp } from '@/context/AppContext';
import { sampleVendors } from '@/data/vendors';
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
  const { events, updateEvent } = useApp();
  
  const event = events.find(e => e.id === id);
  
  const programTemplate = event?.type === 'umembeso' 
    ? umembesoProgramTemplate 
    : umaboProgramTemplate;
  
  const [program, setProgram] = useState<ProgramItem[]>(
    programTemplate.map(item => ({ ...item, completed: false }))
  );
  const [todayNotes, setTodayNotes] = useState('');
  const [vendorStatuses, setVendorStatuses] = useState<Record<string, 'expected' | 'arrived'>>({});

  if (!event) {
    return (
      <div className="min-h-screen bg-primary text-primary-foreground flex items-center justify-center">
        <p>Event not found</p>
      </div>
    );
  }

  const selectedVendors = sampleVendors.filter(v => 
    event.selectedVendorIds.includes(v.id)
  );

  const toggleProgramItem = (itemId: string) => {
    setProgram(prev => prev.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    ));
  };

  const toggleVendorStatus = (vendorId: string) => {
    setVendorStatuses(prev => ({
      ...prev,
      [vendorId]: prev[vendorId] === 'arrived' ? 'expected' : 'arrived'
    }));
  };

  const completedCount = program.filter(p => p.completed).length;

  return (
    <div className="min-h-screen bg-primary/95 text-primary-foreground">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-primary border-b border-primary-foreground/20 px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <Badge className="bg-primary-foreground/20 text-primary-foreground mb-1">
              Ceremony Mode
            </Badge>
            <h1 className="text-xl font-bold">{event.name}</h1>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => navigate(`/events/${id}`)}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Progress */}
        <div className="text-center mb-6">
          <p className="text-primary-foreground/70 text-sm mb-2">Today's Progress</p>
          <p className="text-4xl font-bold">{completedCount} / {program.length}</p>
          <p className="text-primary-foreground/70 text-sm mt-1">items completed</p>
        </div>

        {/* Timeline */}
        <Card className="bg-primary-foreground/10 border-primary-foreground/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-primary-foreground flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Day's Program
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {program.map((item) => (
              <div 
                key={item.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg transition-colors',
                  item.completed 
                    ? 'bg-primary-foreground/20' 
                    : 'hover:bg-primary-foreground/5'
                )}
                onClick={() => toggleProgramItem(item.id)}
              >
                <Checkbox 
                  checked={item.completed}
                  className="mt-0.5 border-primary-foreground/50 data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
                />
                <div className="flex-1">
                  <div className="flex items-baseline gap-3">
                    <span className="text-lg font-mono font-semibold text-primary-foreground/80">
                      {item.time}
                    </span>
                    <span className={cn(
                      'text-base',
                      item.completed && 'line-through text-primary-foreground/50'
                    )}>
                      {item.title}
                    </span>
                  </div>
                </div>
                {item.completed && (
                  <Check className="h-5 w-5 text-secondary" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Vendors */}
        {selectedVendors.length > 0 && (
          <Card className="bg-primary-foreground/10 border-primary-foreground/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-primary-foreground flex items-center gap-2">
                <Users className="h-5 w-5" />
                Vendors ({selectedVendors.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedVendors.map((vendor) => (
                <div 
                  key={vendor.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-primary-foreground/5"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-primary-foreground">{vendor.name}</p>
                    <p className="text-sm text-primary-foreground/70">{vendor.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline"
                      className={cn(
                        'cursor-pointer border-primary-foreground/30',
                        vendorStatuses[vendor.id] === 'arrived' 
                          ? 'bg-secondary text-secondary-foreground border-secondary' 
                          : 'text-primary-foreground'
                      )}
                      onClick={() => toggleVendorStatus(vendor.id)}
                    >
                      {vendorStatuses[vendor.id] === 'arrived' ? 'Arrived' : 'Expected'}
                    </Badge>
                    <a href={`tel:${vendor.phoneNumber}`}>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        className="text-primary-foreground hover:bg-primary-foreground/10"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Quick Notes */}
        <Card className="bg-primary-foreground/10 border-primary-foreground/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-primary-foreground flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Today's Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              placeholder="Quick notes for today..."
              value={todayNotes}
              onChange={(e) => setTodayNotes(e.target.value)}
              className="min-h-[100px] bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
            />
          </CardContent>
        </Card>

        {/* Exit Button */}
        <Button 
          variant="outline"
          className="w-full border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
          onClick={() => navigate(`/events/${id}`)}
        >
          Exit Ceremony Mode
        </Button>
      </div>
    </div>
  );
}
