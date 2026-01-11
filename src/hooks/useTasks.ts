import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, CreateTask } from '@/types/database';
import { toast } from 'sonner';

export function useTasks(eventId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!eventId) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } else {
      setTasks((data || []) as Task[]);
    }
    setIsLoading(false);
  }, [eventId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (taskData: Omit<CreateTask, 'event_id'>) => {
    if (!eventId) return null;

    // Get max sort_order for new task
    const maxOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.sort_order ?? 0)) : 0;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        event_id: eventId,
        sort_order: maxOrder + 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
      return null;
    }

    setTasks(prev => [...prev, data as Task]);
    toast.success('Task added');
    return data as Task;
  };

  const reorderTasks = async (reorderedTasks: Task[]) => {
    // Optimistically update local state
    setTasks(reorderedTasks);

    // Prepare batch updates
    const updates = reorderedTasks.map((task, index) => ({
      id: task.id,
      sort_order: index + 1,
    }));

    // Update each task's sort_order
    for (const update of updates) {
      const { error } = await supabase
        .from('tasks')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id);

      if (error) {
        console.error('Error reordering tasks:', error);
        toast.error('Failed to save task order');
        fetchTasks(); // Revert on error
        return false;
      }
    }

    return true;
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
      return false;
    }

    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    return true;
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
      return false;
    }

    setTasks(prev => prev.filter(t => t.id !== id));
    toast.success('Task deleted');
    return true;
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return false;
    return updateTask(id, { completed: !task.completed });
  };

  const getProgress = () => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  return {
    tasks,
    isLoading,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    reorderTasks,
    getProgress,
    refreshTasks: fetchTasks,
  };
}
