import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BudgetItem, CreateBudgetItem } from '@/types/database';
import { toast } from 'sonner';

export function useBudget(eventId: string | undefined) {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBudget = useCallback(async () => {
    if (!eventId) {
      setBudgetItems([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('budget_items')
      .select('*')
      .eq('event_id', eventId)
      .order('category', { ascending: true });

    if (error) {
      console.error('Error fetching budget:', error);
      toast.error('Failed to load budget');
    } else {
      setBudgetItems((data || []) as BudgetItem[]);
    }
    setIsLoading(false);
  }, [eventId]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  const addBudgetItem = async (itemData: Omit<CreateBudgetItem, 'event_id'>) => {
    if (!eventId) return null;

    const { data, error } = await supabase
      .from('budget_items')
      .insert({
        ...itemData,
        event_id: eventId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding budget item:', error);
      toast.error('Failed to add budget item');
      return null;
    }

    setBudgetItems(prev => [...prev, data as BudgetItem]);
    toast.success('Budget item added');
    return data as BudgetItem;
  };

  const updateBudgetItem = async (id: string, updates: Partial<BudgetItem>) => {
    const { error } = await supabase
      .from('budget_items')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating budget item:', error);
      toast.error('Failed to update budget item');
      return false;
    }

    setBudgetItems(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    return true;
  };

  const deleteBudgetItem = async (id: string) => {
    const { error } = await supabase
      .from('budget_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting budget item:', error);
      toast.error('Failed to delete budget item');
      return false;
    }

    setBudgetItems(prev => prev.filter(b => b.id !== id));
    toast.success('Budget item deleted');
    return true;
  };

  const getSummary = () => {
    return {
      planned: budgetItems.reduce((sum, i) => sum + Number(i.planned_amount), 0),
      actual: budgetItems.reduce((sum, i) => sum + Number(i.actual_amount), 0),
      paid: budgetItems.filter(i => i.is_paid).reduce((sum, i) => sum + Number(i.actual_amount), 0),
    };
  };

  return {
    budgetItems,
    isLoading,
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    getSummary,
    refreshBudget: fetchBudget,
  };
}
