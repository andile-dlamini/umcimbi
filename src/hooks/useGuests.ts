import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Guest, CreateGuest } from '@/types/database';
import { toast } from 'sonner';

export function useGuests(eventId: string | undefined) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGuests = useCallback(async () => {
    if (!eventId) {
      setGuests([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('event_id', eventId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching guests:', error);
      toast.error('Failed to load guests');
    } else {
      setGuests((data || []) as Guest[]);
    }
    setIsLoading(false);
  }, [eventId]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const addGuest = async (guestData: Omit<CreateGuest, 'event_id'>) => {
    if (!eventId) return null;

    const { data, error } = await supabase
      .from('guests')
      .insert({
        ...guestData,
        event_id: eventId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding guest:', error);
      toast.error('Failed to add guest');
      return null;
    }

    setGuests(prev => [...prev, data as Guest]);
    toast.success('Guest added');
    return data as Guest;
  };

  const updateGuest = async (id: string, updates: Partial<Guest>) => {
    const { error } = await supabase
      .from('guests')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating guest:', error);
      toast.error('Failed to update guest');
      return false;
    }

    setGuests(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
    return true;
  };

  const deleteGuest = async (id: string) => {
    const { error } = await supabase
      .from('guests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting guest:', error);
      toast.error('Failed to delete guest');
      return false;
    }

    setGuests(prev => prev.filter(g => g.id !== id));
    toast.success('Guest removed');
    return true;
  };

  const getRsvpCounts = () => {
    return {
      total: guests.length,
      yes: guests.filter(g => g.rsvp_status === 'yes').length,
      no: guests.filter(g => g.rsvp_status === 'no').length,
      invited: guests.filter(g => g.rsvp_status === 'invited').length,
      unknown: guests.filter(g => g.rsvp_status === 'unknown').length,
    };
  };

  return {
    guests,
    isLoading,
    addGuest,
    updateGuest,
    deleteGuest,
    getRsvpCounts,
    refreshGuests: fetchGuests,
  };
}
