import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useApp } from '@/context/AppContext';
import { BudgetCategory } from '@/types';
import { cn } from '@/lib/utils';

interface BudgetTabProps {
  eventId: string;
}

const categories: { value: BudgetCategory; label: string }[] = [
  { value: 'gifts', label: 'Gifts' },
  { value: 'decor', label: 'Decor' },
  { value: 'catering', label: 'Catering' },
  { value: 'livestock', label: 'Livestock' },
  { value: 'transport', label: 'Transport' },
  { value: 'attire', label: 'Attire' },
  { value: 'venue', label: 'Venue' },
  { value: 'other', label: 'Other' },
];

export function BudgetTab({ eventId }: BudgetTabProps) {
  const { getEventBudget, addBudgetItem, updateBudgetItem, deleteBudgetItem, getEventBudgetSummary } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BudgetCategory>('other');
  const [plannedAmount, setPlannedAmount] = useState('');

  const items = getEventBudget(eventId);
  const summary = getEventBudgetSummary(eventId);
  const difference = summary.planned - summary.actual;

  const handleAddItem = () => {
    if (!description.trim() || !plannedAmount) return;

    addBudgetItem({
      eventId,
      description: description.trim(),
      category,
      plannedAmount: parseFloat(plannedAmount) || 0,
      actualAmount: 0,
      isPaid: false,
    });

    // Reset form
    setDescription('');
    setCategory('other');
    setPlannedAmount('');
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Planned</p>
              <p className="text-lg font-bold text-foreground">
                R{summary.planned.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Actual</p>
              <p className="text-lg font-bold text-foreground">
                R{summary.actual.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Remaining</p>
              <p className={cn(
                'text-lg font-bold',
                difference >= 0 ? 'text-success' : 'text-destructive'
              )}>
                R{Math.abs(difference).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Items */}
      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={item.isPaid}
                  onCheckedChange={(checked) => 
                    updateBudgetItem(item.id, { isPaid: checked as boolean })
                  }
                  className="mt-1"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground capitalize">
                      {item.category}
                    </span>
                    {item.isPaid && (
                      <span className="text-xs text-success font-medium">Paid</span>
                    )}
                  </div>
                  <p className={cn(
                    'font-medium text-sm',
                    item.isPaid && 'line-through text-muted-foreground'
                  )}>
                    {item.description}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Planned</Label>
                      <Input
                        type="number"
                        value={item.plannedAmount}
                        onChange={(e) => updateBudgetItem(item.id, { 
                          plannedAmount: parseFloat(e.target.value) || 0 
                        })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Actual</Label>
                      <Input
                        type="number"
                        value={item.actualAmount}
                        onChange={(e) => updateBudgetItem(item.id, { 
                          actualAmount: parseFloat(e.target.value) || 0 
                        })}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteBudgetItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {items.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No budget items yet
          </p>
        )}
      </div>

      {/* Add Budget Item Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Budget Item
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Budget Item</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as BudgetCategory)}>
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
              <Label htmlFor="budget-desc">Description *</Label>
              <Input
                id="budget-desc"
                placeholder="e.g., Tent hire"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget-amount">Planned amount (R) *</Label>
              <Input
                id="budget-amount"
                type="number"
                placeholder="0"
                value={plannedAmount}
                onChange={(e) => setPlannedAmount(e.target.value)}
              />
            </div>

            <Button 
              className="w-full" 
              onClick={handleAddItem}
              disabled={!description.trim() || !plannedAmount}
            >
              Add Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}