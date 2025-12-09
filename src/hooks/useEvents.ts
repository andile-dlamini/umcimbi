import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Event, CreateEvent, EventVendor, Task, BudgetItem } from '@/types/database';
import { getDefaultTasks, getDefaultBudgetItems } from '@/data/templates';
import { toast } from 'sonner';

export function useEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!user) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } else {
      setEvents((data || []) as Event[]);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = async (eventData: Omit<CreateEvent, 'owner_user_id'>): Promise<Event | null> => {
    if (!user) {
      toast.error('Please sign in to create events');
      return null;
    }

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        ...eventData,
        owner_user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
      return null;
    }

    // Create default tasks
    const defaultTasks = getDefaultTasks(event.id, eventData.type);
    const tasksToInsert = defaultTasks.map(t => ({
      event_id: event.id,
      title: t.title,
      description: t.description,
      category: t.category,
      due_date: t.dueDate,
      completed: false,
      assignee_name: t.assigneeName,
    }));

    await supabase.from('tasks').insert(tasksToInsert);

    // Create default budget items
    const defaultBudget = getDefaultBudgetItems(event.id, eventData.type);
    const budgetToInsert = defaultBudget.map(b => ({
      event_id: event.id,
      category: b.category,
      description: b.description,
      planned_amount: b.plannedAmount,
      actual_amount: 0,
      is_paid: false,
    }));

    await supabase.from('budget_items').insert(budgetToInsert);

    setEvents(prev => [event as Event, ...prev]);
    toast.success('Event created successfully');
    return event as Event;
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    const { error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
      return false;
    }

    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    return true;
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
      return false;
    }

    setEvents(prev => prev.filter(e => e.id !== id));
    toast.success('Event deleted');
    return true;
  };

  return {
    events,
    isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    refreshEvents: fetchEvents,
  };
}

export function useEventVendors(eventId: string | undefined) {
  const [eventVendors, setEventVendors] = useState<EventVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEventVendors = useCallback(async () => {
    if (!eventId) {
      setEventVendors([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('event_vendors')
      .select('*')
      .eq('event_id', eventId);

    if (error) {
      console.error('Error fetching event vendors:', error);
    } else {
      setEventVendors((data || []) as EventVendor[]);
    }
    setIsLoading(false);
  }, [eventId]);

  useEffect(() => {
    fetchEventVendors();
  }, [fetchEventVendors]);

  const addVendorToEvent = async (vendorId: string, note?: string) => {
    if (!eventId) return false;

    const { error } = await supabase
      .from('event_vendors')
      .insert({
        event_id: eventId,
        vendor_id: vendorId,
        role_or_note: note,
      });

    if (error) {
      if (error.code === '23505') {
        toast.error('Vendor already added to this event');
      } else {
        console.error('Error adding vendor:', error);
        toast.error('Failed to add vendor');
      }
      return false;
    }

    // Update vendor's added_to_events_count (fire and forget)
    supabase.from('vendors').select('added_to_events_count').eq('id', vendorId).single().then(({ data }) => {
      if (data) {
        supabase.from('vendors').update({ added_to_events_count: (data.added_to_events_count || 0) + 1 }).eq('id', vendorId);
      }
    });
    
    await fetchEventVendors();
    toast.success('Vendor added to event');
    return true;
  };

  const removeVendorFromEvent = async (vendorId: string) => {
    if (!eventId) return false;

    const { error } = await supabase
      .from('event_vendors')
      .delete()
      .eq('event_id', eventId)
      .eq('vendor_id', vendorId);

    if (error) {
      console.error('Error removing vendor:', error);
      toast.error('Failed to remove vendor');
      return false;
    }

    setEventVendors(prev => prev.filter(ev => ev.vendor_id !== vendorId));
    toast.success('Vendor removed');
    return true;
  };

  const isVendorSelected = (vendorId: string) => {
    return eventVendors.some(ev => ev.vendor_id === vendorId);
  };

  return {
    eventVendors,
    isLoading,
    addVendorToEvent,
    removeVendorFromEvent,
    isVendorSelected,
    refreshEventVendors: fetchEventVendors,
  };
}
