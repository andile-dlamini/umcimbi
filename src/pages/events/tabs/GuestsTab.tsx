import { useState } from 'react';
import { Plus, Users, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

interface GuestsTabProps {
  eventId: string;
  estimatedCount: number;
}

const rsvpOptions = [
  { value: 'invited', label: 'Invited', color: 'bg-muted text-muted-foreground' },
  { value: 'yes', label: 'Yes', color: 'bg-success text-success-foreground' },
  { value: 'no', label: 'No', color: 'bg-destructive text-destructive-foreground' },
  { value: 'unknown', label: 'Unknown', color: 'bg-warning text-warning-foreground' },
];

export function GuestsTab({ eventId, estimatedCount }: GuestsTabProps) {
  const { getEventGuests, addGuest, updateGuest, deleteGuest, events, updateEvent } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rsvp, setRsvp] = useState<'invited' | 'yes' | 'no' | 'unknown'>('invited');

  const guests = getEventGuests(eventId);
  const event = events.find(e => e.id === eventId);

  const confirmedCount = guests.filter(g => g.rsvpStatus === 'yes').length;

  const handleAddGuest = () => {
    if (!name.trim()) return;

    addGuest({
      eventId,
      name: name.trim(),
      phoneNumber: phone.trim(),
      rsvpStatus: rsvp,
    });

    // Reset form
    setName('');
    setPhone('');
    setRsvp('invited');
    setIsDialogOpen(false);
  };

  const handleEstimatedChange = (value: string) => {
    const count = parseInt(value) || 0;
    if (event) {
      updateEvent(eventId, { estimatedGuestCount: count });
    }
  };

  return (
    <div className="space-y-6">
      {/* Estimated Guests */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Users className="h-5 w-5 text-primary" />
            <Label htmlFor="est-guests" className="font-medium">Estimated guests</Label>
          </div>
          <Input
            id="est-guests"
            type="number"
            value={estimatedCount}
            onChange={(e) => handleEstimatedChange(e.target.value)}
            className="h-12 text-lg font-semibold"
          />
          <p className="text-xs text-muted-foreground mt-2">
            We'll use this to help you plan food and seating
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      {guests.length > 0 && (
        <div className="grid grid-cols-3 gap-3 text-center">
          <Card>
            <CardContent className="p-3">
              <p className="text-2xl font-bold text-foreground">{guests.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-2xl font-bold text-success">{confirmedCount}</p>
              <p className="text-xs text-muted-foreground">Confirmed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-2xl font-bold text-muted-foreground">
                {guests.filter(g => g.rsvpStatus === 'invited').length}
              </p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Guest List */}
      <div className="space-y-2">
        {guests.map((guest) => {
          const rsvpOption = rsvpOptions.find(r => r.value === guest.rsvpStatus);
          
          return (
            <Card key={guest.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{guest.name}</p>
                    {guest.phoneNumber && (
                      <p className="text-sm text-muted-foreground">{guest.phoneNumber}</p>
                    )}
                  </div>
                  
                  <Select 
                    value={guest.rsvpStatus} 
                    onValueChange={(v) => updateGuest(guest.id, { 
                      rsvpStatus: v as 'invited' | 'yes' | 'no' | 'unknown' 
                    })}
                  >
                    <SelectTrigger className="w-28 h-8">
                      <Badge className={cn('text-xs', rsvpOption?.color)}>
                        {rsvpOption?.label}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {rsvpOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteGuest(guest.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {guests.length === 0 && (
          <p className="text-center text-muted-foreground py-6">
            No guests added yet
          </p>
        )}
      </div>

      {/* Add Guest Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Guest
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Guest</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="guest-name">Name *</Label>
              <Input
                id="guest-name"
                placeholder="e.g., Aunt Nomsa"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-phone">Phone (optional)</Label>
              <Input
                id="guest-phone"
                type="tel"
                placeholder="+27 82 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>RSVP Status</Label>
              <Select value={rsvp} onValueChange={(v) => setRsvp(v as typeof rsvp)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rsvpOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full" 
              onClick={handleAddGuest}
              disabled={!name.trim()}
            >
              Add Guest
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}