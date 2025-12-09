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

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        event_id: eventId,
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
    getProgress,
    refreshTasks: fetchTasks,
  };
}
