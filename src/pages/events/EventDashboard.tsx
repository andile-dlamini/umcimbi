import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Wallet, Pencil, Check, X, TrendingUp, Trash2, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { useEvents } from '@/hooks/useEvents';
import { useTasks } from '@/hooks/useTasks';
import { useEventBudgetSummary } from '@/hooks/useEventBudgetSummary';
import { TasksTab } from './tabs/TasksTab';
// Note: BudgetTab and GuestsTab are kept but hidden for potential future use
// import { BudgetTab } from './tabs/BudgetTab';
// import { GuestsTab } from './tabs/GuestsTab';
import { VendorsTab } from './tabs/VendorsTab';
import { format, differenceInDays, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getEventTypeInfo } from '@/types/database';

export default function EventDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, updateEvent, deleteEvent, isLoading } = useEvents();
  const { tasks, getProgress, updateTask } = useTasks(id);
  const { summary: budgetSummary, updateEstimatedBudget } = useEventBudgetSummary(id);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [editBudget, setEditBudget] = useState('');
  
  const event = events.find(e => e.id === id);
  const [activeTab, setActiveTab] = useState('overview');
  const [notes, setNotes] = useState('');
  
  // Editable fields state
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteEvent = async () => {
    if (!event) return;
    setIsDeleting(true);
    const success = await deleteEvent(event.id);
    setIsDeleting(false);
    if (success) {
      navigate('/events');
    }
  };

  useEffect(() => {
    if (event) {
      setNotes(event.notes || '');
      setEditName(event.name);
      setEditLocation(event.location || '');
    }
  }, [event]);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (event) {
      updateEvent(event.id, { notes: value });
    }
  };

  const handleSaveName = async () => {
    if (event && editName.trim()) {
      await updateEvent(event.id, { name: editName.trim() });
      setIsEditingName(false);
      toast.success('Event name updated');
    }
  };

  const handleSaveLocation = async () => {
    if (event) {
      await updateEvent(event.id, { location: editLocation.trim() || null });
      setIsEditingLocation(false);
      toast.success('Location updated');
    }
  };

  const handleDateChange = async (newDate: Date | undefined) => {
    if (!event || !newDate) return;
    
    const oldDate = event.date ? new Date(event.date) : null;
    const newDateStr = format(newDate, 'yyyy-MM-dd');
    
    // Update the event date
    await updateEvent(event.id, { date: newDateStr });
    
    // Recalculate task due dates if there was an old date
    if (oldDate && tasks.length > 0) {
      const daysDiff = differenceInDays(newDate, oldDate);
      
      if (daysDiff !== 0) {
        // Update all tasks with due dates
        const tasksWithDueDates = tasks.filter(t => t.due_date);
        for (const task of tasksWithDueDates) {
          const oldDueDate = new Date(task.due_date!);
          const newDueDate = addDays(oldDueDate, daysDiff);
          await updateTask(task.id, { due_date: format(newDueDate, 'yyyy-MM-dd') });
        }
        toast.success(`Event date updated. ${tasksWithDueDates.length} task dates recalculated.`);
      } else {
        toast.success('Event date updated');
      }
    } else {
      toast.success('Event date updated');
    }
    
    setDatePickerOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-safe">
        <PageHeader title="Loading..." showBack />
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen pb-safe">
        <PageHeader title="Event not found" showBack />
        <div className="px-4 py-12 text-center">
          <p className="text-muted-foreground">This event doesn't exist.</p>
          <Button className="mt-4" onClick={() => navigate('/events')}>
            Go to events
          </Button>
        </div>
      </div>
    );
  }

  const progress = getProgress();

  const formattedDate = event.date 
    ? format(new Date(event.date), 'dd MMMM yyyy')
    : 'Date not set';

  return (
    <div className="min-h-screen pb-safe">
      <PageHeader 
        title={isEditingName ? '' : event.name} 
        showBack 
        rightAction={
          !isEditingName && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setIsEditingName(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Event</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{event.name}"? This will also delete all associated tasks, budget items, and vendor assignments. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteEvent}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )
        }
      />

      {/* Inline name editing */}
      {isEditingName && (
        <div className="px-4 py-2 bg-background border-b flex items-center gap-2">
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="flex-1"
            autoFocus
          />
          <Button size="icon" variant="ghost" onClick={handleSaveName}>
            <Check className="h-4 w-4 text-primary" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => { setIsEditingName(false); setEditName(event.name); }}>
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      )}

      {/* Hero Card */}
      <div className={cn(
        'px-4 py-5',
        event.type === 'umembeso' ? 'bg-secondary/10' : 'bg-accent/10'
      )}>
        <div className="max-w-lg mx-auto">
          <div className="mb-3">
            <Badge 
              className={cn(
                event.type === 'umembeso' 
                  ? 'bg-secondary text-secondary-foreground' 
                  : 'bg-accent text-accent-foreground'
              )}
            >
              {getEventTypeInfo(event.type).shortLabel}
            </Badge>
            {/* Ceremony Mode button removed - code preserved in CeremonyMode.tsx */}
          </div>

          <div className="space-y-2 text-sm text-muted-foreground mb-4">
            {/* Editable Date */}
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 hover:text-foreground transition-colors group">
                  <Calendar className="h-4 w-4" />
                  <span>{formattedDate}</span>
                  <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={event.date ? new Date(event.date) : undefined}
                  onSelect={handleDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Editable Location */}
            {isEditingLocation ? (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <Input
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="h-7 text-sm flex-1"
                  placeholder="Enter location"
                  autoFocus
                />
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveLocation}>
                  <Check className="h-3 w-3 text-primary" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setIsEditingLocation(false); setEditLocation(event.location || ''); }}>
                  <X className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            ) : (
              <button 
                className="flex items-center gap-2 hover:text-foreground transition-colors group"
                onClick={() => setIsEditingLocation(true)}
              >
                <MapPin className="h-4 w-4" />
                <span>{event.location || 'Add location'}</span>
                <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>

          <ProgressBar value={progress} showLabel />
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-lg mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky top-14 z-30 bg-background border-b border-border">
            <TabsList className="w-full h-auto p-0 bg-transparent rounded-none">
              <TabsTrigger 
                value="overview" 
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="tasks"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
              >
                Tasks
              </TabsTrigger>
              <TabsTrigger 
                value="vendors"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
              >
                Vendors
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="px-4 py-6 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-xs">Est. Guests</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {event.estimated_guest_count}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Wallet className="h-4 w-4" />
                    <span className="text-xs">Est. Budget</span>
                  </div>
                  {isEditingBudget ? (
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold">R</span>
                      <Input
                        type="number"
                        value={editBudget}
                        onChange={(e) => setEditBudget(e.target.value)}
                        className="h-8 w-24 text-lg font-bold"
                        autoFocus
                      />
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6"
                        onClick={async () => {
                          const val = parseFloat(editBudget) || 0;
                          await updateEstimatedBudget(val);
                          setIsEditingBudget(false);
                          toast.success('Budget updated');
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <button 
                      className="flex items-center gap-1 group"
                      onClick={() => {
                        setEditBudget(budgetSummary.estimatedBudget.toString());
                        setIsEditingBudget(true);
                      }}
                    >
                      <p className="text-2xl font-bold text-foreground">
                        R{budgetSummary.estimatedBudget.toLocaleString()}
                      </p>
                      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 text-muted-foreground" />
                    </button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Running Budget from Bookings */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs">Running Budget (from bookings)</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      R{budgetSummary.runningBudget.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{budgetSummary.bookingsCount} vendor{budgetSummary.bookingsCount !== 1 ? 's' : ''} booked</p>
                    {budgetSummary.estimatedBudget > 0 && (
                      <p className={cn(
                        "text-sm font-medium",
                        budgetSummary.runningBudget > budgetSummary.estimatedBudget 
                          ? "text-destructive" 
                          : "text-success"
                      )}>
                        {budgetSummary.runningBudget <= budgetSummary.estimatedBudget 
                          ? `R${(budgetSummary.estimatedBudget - budgetSummary.runningBudget).toLocaleString()} remaining`
                          : `R${(budgetSummary.runningBudget - budgetSummary.estimatedBudget).toLocaleString()} over budget`
                        }
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Event Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add notes about your ceremony..."
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="px-4 py-6">
            <TasksTab eventId={event.id} />
          </TabsContent>

          {/* Note: Budget and Guests tabs are hidden but code is preserved for future use */}
          {/* 
          <TabsContent value="budget" className="px-4 py-6">
            <BudgetTab eventId={event.id} />
          </TabsContent>

          <TabsContent value="guests" className="px-4 py-6">
            <GuestsTab eventId={event.id} estimatedCount={event.estimated_guest_count} />
          </TabsContent>
          */}

          <TabsContent value="vendors" className="px-4 py-6">
            <VendorsTab eventId={event.id} location={event.location || ''} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
