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

const categoryStyles: Record<string, { bg: string; text: string; border: string }> = {
  gifts: { bg: 'bg-accent/15', text: 'text-accent', border: 'border-accent/30' },
  decor: { bg: 'bg-secondary/15', text: 'text-secondary', border: 'border-secondary/30' },
  livestock: { bg: 'bg-primary/15', text: 'text-primary', border: 'border-primary/30' },
  transport: { bg: 'bg-secondary/15', text: 'text-secondary', border: 'border-secondary/30' },
  catering: { bg: 'bg-success/15', text: 'text-success', border: 'border-success/30' },
  attire: { bg: 'bg-primary/15', text: 'text-primary', border: 'border-primary/30' },
  finance: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted' },
  venue: { bg: 'bg-accent/15', text: 'text-accent', border: 'border-accent/30' },
  other: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted' },
};

export function TaskCard({ task, showDelete = false }: TaskCardProps) {
  const { toggleTask, deleteTask } = useTasks(task.event_id);

  const handleToggle = () => {
    toggleTask(task.id);
  };

  const style = categoryStyles[task.category || 'other'] || categoryStyles.other;

  return (
    <Card className={cn('transition-all hover:shadow-shweshwe', task.completed && 'opacity-60')}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.completed}
            onCheckedChange={handleToggle}
            className="mt-0.5 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
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
                className={cn(
                  'text-xs capitalize',
                  style.bg,
                  style.text,
                  style.border
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
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