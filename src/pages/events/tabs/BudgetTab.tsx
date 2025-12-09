import { useState } from 'react';
import { Plus, Trash2, Minus, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useBudget } from '@/hooks/useBudget';
import { BudgetCategory, BudgetItem } from '@/types/database';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  const { budgetItems, addBudgetItem, updateBudgetItem, deleteBudgetItem, getSummary, isLoading } = useBudget(eventId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScaleDialogOpen, setIsScaleDialogOpen] = useState(false);
  const [scalePercent, setScalePercent] = useState(100);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  
  // Form state
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BudgetCategory>('other');
  const [plannedAmount, setPlannedAmount] = useState('');

  const summary = getSummary();
  const difference = summary.planned - summary.actual;

  const handleAddItem = async () => {
    if (!description.trim() || !plannedAmount) return;

    await addBudgetItem({
      description: description.trim(),
      category,
      planned_amount: parseFloat(plannedAmount) || 0,
      actual_amount: 0,
      is_paid: false,
    });

    // Reset form
    setDescription('');
    setCategory('other');
    setPlannedAmount('');
    setIsDialogOpen(false);
  };

  const handleQuickAdjust = (item: BudgetItem, delta: number) => {
    const newAmount = Math.max(0, Number(item.planned_amount) + delta);
    updateBudgetItem(item.id, { planned_amount: newAmount });
  };

  const handleScaleBudget = async () => {
    const multiplier = scalePercent / 100;
    
    for (const item of budgetItems) {
      const newPlanned = Math.round(Number(item.planned_amount) * multiplier);
      await updateBudgetItem(item.id, { planned_amount: newPlanned });
    }
    
    toast.success(`Budget scaled to ${scalePercent}%`);
    setIsScaleDialogOpen(false);
    setScalePercent(100);
  };

  const getScaledTotal = () => {
    return Math.round(summary.planned * (scalePercent / 100));
  };

  if (isLoading) {
    return <p className="text-center text-muted-foreground py-8">Loading budget...</p>;
  }

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

          {/* Scale Budget Button */}
          {budgetItems.length > 0 && (
            <Dialog open={isScaleDialogOpen} onOpenChange={setIsScaleDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  <ChevronUp className="h-4 w-4 mr-1" />
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Adjust entire budget
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Scale Budget</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 pt-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Adjust all budget items by percentage
                    </p>
                    <p className="text-4xl font-bold text-primary">{scalePercent}%</p>
                  </div>

                  <Slider
                    value={[scalePercent]}
                    onValueChange={([v]) => setScalePercent(v)}
                    min={50}
                    max={200}
                    step={5}
                    className="w-full"
                  />

                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>50%</span>
                    <span>100%</span>
                    <span>200%</span>
                  </div>

                  <div className="bg-muted rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">New total will be</p>
                    <p className="text-2xl font-bold">
                      R{getScaledTotal().toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {scalePercent > 100 ? '+' : ''}{Math.round((scalePercent - 100) / 100 * summary.planned).toLocaleString()} from current
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setScalePercent(100);
                        setIsScaleDialogOpen(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={handleScaleBudget}
                      disabled={scalePercent === 100}
                    >
                      Apply {scalePercent}%
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>

      {/* Budget Items */}
      <div className="space-y-2">
        {budgetItems.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={item.is_paid}
                  onCheckedChange={(checked) => 
                    updateBudgetItem(item.id, { is_paid: checked as boolean })
                  }
                  className="mt-1"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground capitalize">
                      {item.category}
                    </span>
                    {item.is_paid && (
                      <span className="text-xs text-success font-medium">Paid</span>
                    )}
                  </div>
                  <p className={cn(
                    'font-medium text-sm',
                    item.is_paid && 'line-through text-muted-foreground'
                  )}>
                    {item.description}
                  </p>
                  
                  {/* Editable amounts */}
                  <div className="flex items-center gap-2 mt-2">
                    {/* Planned Amount with +/- */}
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Planned</Label>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => handleQuickAdjust(item, -500)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          value={item.planned_amount}
                          onChange={(e) => updateBudgetItem(item.id, { 
                            planned_amount: parseFloat(e.target.value) || 0 
                          })}
                          className="h-8 text-sm text-center"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => handleQuickAdjust(item, 500)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Actual Amount */}
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Actual</Label>
                      <Input
                        type="number"
                        value={item.actual_amount}
                        onChange={(e) => updateBudgetItem(item.id, { 
                          actual_amount: parseFloat(e.target.value) || 0 
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

        {budgetItems.length === 0 && (
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
