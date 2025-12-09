import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Event, Task, BudgetItem, Guest, User, AppState } from '@/types';
import { getDefaultTasks, getDefaultBudgetItems } from '@/data/templates';

interface AppContextType extends AppState {
  // User actions
  setUser: (user: User | null) => void;
  logout: () => void;
  
  // Event actions
  createEvent: (event: Omit<Event, 'id' | 'createdAt' | 'selectedVendorIds'>) => Event;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  addVendorToEvent: (eventId: string, vendorId: string) => void;
  removeVendorFromEvent: (eventId: string, vendorId: string) => void;
  
  // Task actions
  addTask: (task: Omit<Task, 'id'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  getEventTasks: (eventId: string) => Task[];
  
  // Budget actions
  addBudgetItem: (item: Omit<BudgetItem, 'id'>) => BudgetItem;
  updateBudgetItem: (id: string, updates: Partial<BudgetItem>) => void;
  deleteBudgetItem: (id: string) => void;
  getEventBudget: (eventId: string) => BudgetItem[];
  
  // Guest actions
  addGuest: (guest: Omit<Guest, 'id'>) => Guest;
  updateGuest: (id: string, updates: Partial<Guest>) => void;
  deleteGuest: (id: string) => void;
  getEventGuests: (eventId: string) => Guest[];
  
  // Computed
  getEventProgress: (eventId: string) => number;
  getEventBudgetSummary: (eventId: string) => { planned: number; actual: number };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'isiko-planner-data';

const generateId = () => Math.random().toString(36).substring(2, 9);

const loadFromStorage = (): Partial<AppState> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load from storage:', e);
  }
  return {};
};

const saveToStorage = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save to storage:', e);
  }
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isOnboarded, setIsOnboarded] = useState(false);

  // Load initial state
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored.user) setUserState(stored.user);
    if (stored.events) setEvents(stored.events);
    if (stored.tasks) setTasks(stored.tasks);
    if (stored.budgetItems) setBudgetItems(stored.budgetItems);
    if (stored.guests) setGuests(stored.guests);
    if (stored.isOnboarded) setIsOnboarded(stored.isOnboarded);
  }, []);

  // Save on changes
  useEffect(() => {
    saveToStorage({ user, events, tasks, budgetItems, guests, isOnboarded });
  }, [user, events, tasks, budgetItems, guests, isOnboarded]);

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) setIsOnboarded(true);
  };

  const logout = () => {
    setUserState(null);
    setIsOnboarded(false);
  };

  const createEvent = (eventData: Omit<Event, 'id' | 'createdAt' | 'selectedVendorIds'>): Event => {
    const newEvent: Event = {
      ...eventData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      selectedVendorIds: [],
    };
    setEvents(prev => [...prev, newEvent]);

    // Create default tasks
    const defaultTasks = getDefaultTasks(newEvent.id, newEvent.type);
    const newTasks = defaultTasks.map(t => ({ ...t, id: generateId() }));
    setTasks(prev => [...prev, ...newTasks]);

    // Create default budget items
    const defaultBudget = getDefaultBudgetItems(newEvent.id, newEvent.type);
    const newBudgetItems = defaultBudget.map(b => ({ ...b, id: generateId() }));
    setBudgetItems(prev => [...prev, ...newBudgetItems]);

    return newEvent;
  };

  const updateEvent = (id: string, updates: Partial<Event>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setTasks(prev => prev.filter(t => t.eventId !== id));
    setBudgetItems(prev => prev.filter(b => b.eventId !== id));
    setGuests(prev => prev.filter(g => g.eventId !== id));
  };

  const addVendorToEvent = (eventId: string, vendorId: string) => {
    setEvents(prev => prev.map(e => 
      e.id === eventId && !e.selectedVendorIds.includes(vendorId)
        ? { ...e, selectedVendorIds: [...e.selectedVendorIds, vendorId] }
        : e
    ));
  };

  const removeVendorFromEvent = (eventId: string, vendorId: string) => {
    setEvents(prev => prev.map(e => 
      e.id === eventId 
        ? { ...e, selectedVendorIds: e.selectedVendorIds.filter(v => v !== vendorId) }
        : e
    ));
  };

  const addTask = (taskData: Omit<Task, 'id'>): Task => {
    const newTask: Task = { ...taskData, id: generateId() };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const getEventTasks = (eventId: string) => tasks.filter(t => t.eventId === eventId);

  const addBudgetItem = (itemData: Omit<BudgetItem, 'id'>): BudgetItem => {
    const newItem: BudgetItem = { ...itemData, id: generateId() };
    setBudgetItems(prev => [...prev, newItem]);
    return newItem;
  };

  const updateBudgetItem = (id: string, updates: Partial<BudgetItem>) => {
    setBudgetItems(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBudgetItem = (id: string) => {
    setBudgetItems(prev => prev.filter(b => b.id !== id));
  };

  const getEventBudget = (eventId: string) => budgetItems.filter(b => b.eventId === eventId);

  const addGuest = (guestData: Omit<Guest, 'id'>): Guest => {
    const newGuest: Guest = { ...guestData, id: generateId() };
    setGuests(prev => [...prev, newGuest]);
    return newGuest;
  };

  const updateGuest = (id: string, updates: Partial<Guest>) => {
    setGuests(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const deleteGuest = (id: string) => {
    setGuests(prev => prev.filter(g => g.id !== id));
  };

  const getEventGuests = (eventId: string) => guests.filter(g => g.eventId === eventId);

  const getEventProgress = (eventId: string): number => {
    const eventTasks = getEventTasks(eventId);
    if (eventTasks.length === 0) return 0;
    const completed = eventTasks.filter(t => t.completed).length;
    return Math.round((completed / eventTasks.length) * 100);
  };

  const getEventBudgetSummary = (eventId: string) => {
    const items = getEventBudget(eventId);
    return {
      planned: items.reduce((sum, i) => sum + i.plannedAmount, 0),
      actual: items.reduce((sum, i) => sum + i.actualAmount, 0),
    };
  };

  const value: AppContextType = {
    user,
    events,
    tasks,
    budgetItems,
    guests,
    isOnboarded,
    setUser,
    logout,
    createEvent,
    updateEvent,
    deleteEvent,
    addVendorToEvent,
    removeVendorFromEvent,
    addTask,
    updateTask,
    deleteTask,
    getEventTasks,
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    getEventBudget,
    addGuest,
    updateGuest,
    deleteGuest,
    getEventGuests,
    getEventProgress,
    getEventBudgetSummary,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}