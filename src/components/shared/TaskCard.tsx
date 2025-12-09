import { Task } from '@/types/database';
import { useTasks } from '@/hooks/useTasks';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  showDelete?: boolean;
}

const categoryColors: Record<string, string> = {
  gifts: 'bg-secondary/20 text-secondary border-secondary/30',
  decor: 'bg-accent/20 text-accent border-accent/30',
  livestock: 'bg-warning/20 text-warning-foreground border-warning/30',
  transport: 'bg-primary/20 text-primary border-primary/30',
  catering: 'bg-success/20 text-success border-success/30',
  attire: 'bg-accent/20 text-accent border-accent/30',
  finance: 'bg-muted text-muted-foreground border-muted',
  venue: 'bg-primary/20 text-primary border-primary/30',
  other: 'bg-muted text-muted-foreground border-muted',
};

export function TaskCard({ task, showDelete = false }: TaskCardProps) {
  const { toggleTask, deleteTask } = useTasks(task.event_id);

  const handleToggle = () => {
    toggleTask(task.id);
  };

  return (
    <Card className={cn('transition-opacity', task.completed && 'opacity-60')}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
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
          
          {showDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => deleteTask(task.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
