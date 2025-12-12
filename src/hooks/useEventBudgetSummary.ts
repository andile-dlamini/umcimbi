import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EventBudgetSummary {
  estimatedBudget: number;
  runningBudget: number;
  bookingsCount: number;
}

export function useEventBudgetSummary(eventId: string | undefined) {
  const [summary, setSummary] = useState<EventBudgetSummary>({
    estimatedBudget: 0,
    runningBudget: 0,
    bookingsCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!eventId) {
        setIsLoading(false);
        return;
      }

      // Fetch event's estimated budget
      const { data: eventData } = await supabase
        .from('events')
        .select('estimated_budget')
        .eq('id', eventId)
        .maybeSingle();

      // Fetch sum of all accepted bookings (agreed_price)
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('agreed_price')
        .eq('event_id', eventId);

      const runningBudget = bookingsData?.reduce((sum, b) => sum + (b.agreed_price || 0), 0) || 0;

      setSummary({
        estimatedBudget: eventData?.estimated_budget || 0,
        runningBudget,
        bookingsCount: bookingsData?.length || 0,
      });
      setIsLoading(false);
    };

    fetchSummary();
  }, [eventId]);

  const updateEstimatedBudget = async (newBudget: number) => {
    if (!eventId) return false;

    const { error } = await supabase
      .from('events')
      .update({ estimated_budget: newBudget })
      .eq('id', eventId);

    if (error) {
      console.error('Error updating estimated budget:', error);
      return false;
    }

    setSummary(prev => ({ ...prev, estimatedBudget: newBudget }));
    return true;
  };

  return { summary, isLoading, updateEstimatedBudget };
}
