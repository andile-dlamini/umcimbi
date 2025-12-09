import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TaskCard } from '@/components/shared/TaskCard';
import { useApp } from '@/context/AppContext';
import { TaskCategory } from '@/types';
import { isThisWeek, parseISO } from 'date-fns';

interface TasksTabProps {
  eventId: string;
}

const categories: { value: TaskCategory; label: string }[] = [
  { value: 'gifts', label: 'Gifts' },
  { value: 'decor', label: 'Decor' },
  { value: 'livestock', label: 'Livestock' },
  { value: 'transport', label: 'Transport' },
  { value: 'catering', label: 'Catering' },
  { value: 'attire', label: 'Attire' },
  { value: 'finance', label: 'Finance' },
  { value: 'venue', label: 'Venue' },
  { value: 'other', label: 'Other' },
];

type FilterType = 'all' | 'thisWeek' | 'completed';

export function TasksTab({ eventId }: TasksTabProps) {
  const { getEventTasks, addTask } = useApp();
  const [filter, setFilter] = useState<FilterType>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('other');
  const [dueDate, setDueDate] = useState('');

  const tasks = getEventTasks(eventId);

  const filteredTasks = tasks.filter(task => {
    switch (filter) {
      case 'thisWeek':
        return task.dueDate && isThisWeek(parseISO(task.dueDate)) && !task.completed;
      case 'completed':
        return task.completed;
      default:
        return true;
    }
  });

  const incompleteTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);

  const handleAddTask = () => {
    if (!title.trim()) return;

    addTask({
      eventId,
      title: title.trim(),
      description: description.trim(),
      category,
      dueDate: dueDate || null,
      completed: false,
      assigneeName: '',
    });

    // Reset form
    setTitle('');
    setDescription('');
    setCategory('other');
    setDueDate('');
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center gap-2">
        {(['all', 'thisWeek', 'completed'] as FilterType[]).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f === 'thisWeek' ? 'This Week' : f}
          </Button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filter !== 'completed' && incompleteTasks.map((task) => (
          <TaskCard key={task.id} task={task} showDelete />
        ))}
        
        {filter === 'completed' || filter === 'all' ? (
          completedTasks.map((task) => (
            <TaskCard key={task.id} task={task} showDelete />
          ))
        ) : null}

        {filteredTasks.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No tasks found
          </p>
        )}
      </div>

      {/* Add Task Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title *</Label>
              <Input
                id="task-title"
                placeholder="e.g., Book photographer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-desc">Description (optional)</Label>
              <Input
                id="task-desc"
                placeholder="Add details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TaskCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-date">Due date (optional)</Label>
              <Input
                id="task-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <Button 
              className="w-full" 
              onClick={handleAddTask}
              disabled={!title.trim()}
            >
              Add Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}