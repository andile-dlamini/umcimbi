-- Add sort_order column to tasks table for drag-and-drop ordering
ALTER TABLE public.tasks 
ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

-- Set initial sort_order based on created_at for existing tasks
UPDATE public.tasks 
SET sort_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY due_date NULLS LAST, created_at) as row_num
  FROM public.tasks
) AS subquery
WHERE tasks.id = subquery.id;

-- Add index for efficient ordering queries
CREATE INDEX idx_tasks_sort_order ON public.tasks(event_id, sort_order);