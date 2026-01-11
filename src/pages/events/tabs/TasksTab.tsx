import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TaskCard } from '@/components/shared/TaskCard';
import { useTasks } from '@/hooks/useTasks';
import { Task, TaskCategory } from '@/types/database';
import { isThisWeek, parseISO } from 'date-fns';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

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
  const { tasks, addTask, updateTask, toggleTask, deleteTask, reorderTasks, isLoading } = useTasks(eventId);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('other');
  const [dueDate, setDueDate] = useState('');

  const filteredTasks = tasks.filter(task => {
    switch (filter) {
      case 'thisWeek':
        return task.due_date && isThisWeek(parseISO(task.due_date)) && !task.completed;
      case 'completed':
        return task.completed;
      default:
        return true;
    }
  });

  const incompleteTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('other');
    setDueDate('');
    setEditingTask(null);
  };

  const handleAddTask = async () => {
    if (!title.trim()) return;

    await addTask({
      title: title.trim(),
      description: description.trim() || null,
      category,
      due_date: dueDate || null,
      completed: false,
      assignee_name: null,
    });

    resetForm();
    setIsDialogOpen(false);
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !title.trim()) return;

    await updateTask(editingTask.id, {
      title: title.trim(),
      description: description.trim() || null,
      category,
      due_date: dueDate || null,
    });

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setCategory(task.category);
    setDueDate(task.due_date || '');
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    
    if (sourceIndex === destIndex) return;

    // Reorder only incomplete tasks (we're using filter 'all' or 'thisWeek')
    const reordered = Array.from(incompleteTasks);
    const [removed] = reordered.splice(sourceIndex, 1);
    reordered.splice(destIndex, 0, removed);

    // Merge back with completed tasks and update
    const newTaskOrder = [...reordered, ...completedTasks];
    reorderTasks(newTaskOrder);
  };

  if (isLoading) {
    return <p className="text-center text-muted-foreground py-8">Loading tasks...</p>;
  }

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

      {/* Task List with Drag and Drop */}
      <div className="space-y-3">
        {filter !== 'completed' && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="tasks">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-3"
                >
                  {incompleteTasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          style={provided.draggableProps.style}
                          className={snapshot.isDragging ? 'opacity-90' : ''}
                        >
                          <TaskCard
                            task={task}
                            showDelete
                            showDragHandle
                            onToggle={toggleTask}
                            onDelete={deleteTask}
                            onEdit={handleEditClick}
                            dragHandleProps={provided.dragHandleProps || undefined}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
        
        {(filter === 'completed' || filter === 'all') && completedTasks.length > 0 && (
          <div className="space-y-3">
            {filter === 'all' && completedTasks.length > 0 && incompleteTasks.length > 0 && (
              <p className="text-sm text-muted-foreground pt-4">Completed</p>
            )}
            {completedTasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                showDelete 
                onToggle={toggleTask}
                onDelete={deleteTask}
                onEdit={handleEditClick}
              />
            ))}
          </div>
        )}

        {filteredTasks.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No tasks found
          </p>
        )}
      </div>

      {/* Add/Edit Task Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
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
              onClick={editingTask ? handleUpdateTask : handleAddTask}
              disabled={!title.trim()}
            >
              {editingTask ? 'Save Changes' : 'Add Task'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
