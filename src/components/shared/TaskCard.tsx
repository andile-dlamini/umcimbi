import { Task, TaskCategory } from '@/types/database';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Trash2, Pencil, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface TaskCardProps {
  task: Task;
  showDelete?: boolean;
  showDragHandle?: boolean;
  onToggle?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onEdit?: (task: Task) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

const categoryColors: Record<string, string> = {
  gifts: 'bg-accent/20 text-accent border-accent/50',
  decor: 'bg-accent/20 text-accent border-accent/50',
  livestock: 'bg-accent/20 text-accent border-accent/50',
  transport: 'bg-accent/20 text-accent border-accent/50',
  catering: 'bg-accent/20 text-accent border-accent/50',
  attire: 'bg-accent/20 text-accent border-accent/50',
  finance: 'bg-accent/20 text-accent border-accent/50',
  venue: 'bg-accent/20 text-accent border-accent/50',
  other: 'bg-accent/20 text-accent border-accent/50',
};

export const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(
  ({ task, showDelete = false, showDragHandle = false, onToggle, onDelete, onEdit, dragHandleProps, ...props }, ref) => {
    const handleToggle = () => {
      onToggle?.(task.id);
    };

    const handleDelete = () => {
      onDelete?.(task.id);
    };

    const handleEdit = () => {
      onEdit?.(task);
    };

    return (
      <Card 
        ref={ref}
        className={cn('transition-opacity border-card-border', task.completed && 'opacity-60')}
        {...props}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {showDragHandle && (
              <div
                {...dragHandleProps}
                className="cursor-grab active:cursor-grabbing mt-0.5 text-muted-foreground hover:text-foreground"
              >
                <GripVertical className="h-5 w-5" />
              </div>
            )}
            
            <Checkbox
              checked={task.completed}
              onCheckedChange={handleToggle}
              className="mt-0.5"
            />
            
            <div className="flex-1 min-w-0">
              <p className={cn(
                'font-medium text-foreground',
                task.completed && 'line-through text-muted-foreground'
              )}>
                {task.title}
              </p>
              
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}
              
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge 
                  variant="outline" 
                  className={cn('text-xs capitalize', categoryColors[task.category])}
                >
                  {task.category}
                </Badge>
                
                {task.due_date && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(task.due_date), 'dd MMM')}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={handleEdit}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              
              {showDelete && onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

TaskCard.displayName = 'TaskCard';
