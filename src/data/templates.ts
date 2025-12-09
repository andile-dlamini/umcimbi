import { TaskCategory, BudgetCategory, EventType } from '@/types/database';

interface TaskTemplate {
  title: string;
  description: string;
  category: TaskCategory;
  due_date: string | null;
  completed: boolean;
  assignee_name: string | null;
}

interface BudgetTemplate {
  category: BudgetCategory;
  description: string;
  planned_amount: number;
  actual_amount: number;
  is_paid: boolean;
}

export const getDefaultTasks = (eventId: string, eventType: EventType): TaskTemplate[] => {
  const baseTasks: TaskTemplate[] = [
    {
      title: 'Set the date with both families',
      description: 'Coordinate with both families to agree on a suitable date',
      category: 'other',
      due_date: null,
      completed: false,
      assignee_name: null,
    },
    {
      title: 'Confirm venue/homestead',
      description: 'Confirm the location where the ceremony will take place',
      category: 'venue',
      due_date: null,
      completed: false,
      assignee_name: null,
    },
    {
      title: 'Book photographer',
      description: 'Find and book a photographer who understands traditional ceremonies',
      category: 'other',
      due_date: null,
      completed: false,
      assignee_name: null,
    },
  ];

  if (eventType === 'umembeso') {
    return [
      ...baseTasks,
      {
        title: 'Negotiate and finalize gift list (izibizo)',
        description: 'Work with both families to agree on the gifts required',
        category: 'gifts',
        due_date: null,
        completed: false,
        assignee_name: null,
      },
      {
        title: 'Purchase blankets (izingubo)',
        description: 'Buy the required blankets for the in-laws',
        category: 'gifts',
        due_date: null,
        completed: false,
        assignee_name: null,
      },
      {
        title: 'Purchase pinafores and headwraps',
        description: 'Get the traditional clothing items for mothers and aunts',
        category: 'gifts',
        due_date: null,
        completed: false,
        assignee_name: null,
      },
      {
        title: 'Purchase groceries for in-laws',
        description: 'Buy the food items as part of the gifts',
        category: 'gifts',
        due_date: null,
        completed: false,
        assignee_name: null,
      },
      {
        title: 'Arrange transport for gifts',
        description: 'Organize how gifts will be transported to the homestead',
        category: 'transport',
        due_date: null,
        completed: false,
        assignee_name: null,
      },
      {
        title: 'Prepare umakoti attire',
        description: 'Get the traditional outfit for the bride',
        category: 'attire',
        due_date: null,
        completed: false,
        assignee_name: null,
      },
      {
        title: 'Organize refreshments for guests',
        description: 'Plan food and drinks for attendees',
        category: 'catering',
        due_date: null,
        completed: false,
        assignee_name: null,
      },
    ];
  }

  // Umabo tasks
  return [
    ...baseTasks,
    {
      title: 'Confirm cattle (inkomo) arrangements',
      description: 'Arrange for the required cattle for the ceremony',
      category: 'livestock',
      due_date: null,
      completed: false,
      assignee_name: null,
    },
    {
      title: 'Book tent and seating',
      description: 'Hire tents, chairs, and tables for guests',
      category: 'venue',
      due_date: null,
      completed: false,
      assignee_name: null,
    },
    {
      title: 'Arrange catering',
      description: 'Book catering for traditional food including pap, meat, and salads',
      category: 'catering',
      due_date: null,
      completed: false,
      assignee_name: null,
    },
    {
      title: 'Order traditional beer (utshwala)',
      description: 'Arrange for traditional beer to be brewed or purchased',
      category: 'catering',
      due_date: null,
      completed: false,
      assignee_name: null,
    },
    {
      title: 'Plan decor setup',
      description: 'Organize traditional decorations, umbrellas, and mats',
      category: 'decor',
      due_date: null,
      completed: false,
      assignee_name: null,
    },
    {
      title: 'Prepare bridal party attire',
      description: 'Coordinate traditional outfits for the wedding party',
      category: 'attire',
      due_date: null,
      completed: false,
      assignee_name: null,
    },
    {
      title: 'Arrange goat for ceremonies',
      description: 'Source a goat for traditional rituals',
      category: 'livestock',
      due_date: null,
      completed: false,
      assignee_name: null,
    },
    {
      title: 'Book transport for bridal party',
      description: 'Arrange transport to and from the venue',
      category: 'transport',
      due_date: null,
      completed: false,
      assignee_name: null,
    },
    {
      title: 'Prepare izibongo (praise songs)',
      description: 'Work with elders on the praise songs for the ceremony',
      category: 'other',
      due_date: null,
      completed: false,
      assignee_name: null,
    },
  ];
};

export const getDefaultBudgetItems = (eventId: string, eventType: EventType): BudgetTemplate[] => {
  if (eventType === 'umembeso') {
    return [
      { category: 'gifts', description: 'Blankets (izingubo)', planned_amount: 3000, actual_amount: 0, is_paid: false },
      { category: 'gifts', description: 'Pinafores & headwraps', planned_amount: 2000, actual_amount: 0, is_paid: false },
      { category: 'gifts', description: 'Groceries for in-laws', planned_amount: 5000, actual_amount: 0, is_paid: false },
      { category: 'attire', description: 'Umakoti outfit', planned_amount: 2500, actual_amount: 0, is_paid: false },
      { category: 'transport', description: 'Gift transport', planned_amount: 1500, actual_amount: 0, is_paid: false },
      { category: 'catering', description: 'Refreshments', planned_amount: 3000, actual_amount: 0, is_paid: false },
      { category: 'other', description: 'Photography', planned_amount: 3500, actual_amount: 0, is_paid: false },
    ];
  }

  // Umabo budget
  return [
    { category: 'livestock', description: 'Cattle (inkomo)', planned_amount: 15000, actual_amount: 0, is_paid: false },
    { category: 'livestock', description: 'Goat for rituals', planned_amount: 2500, actual_amount: 0, is_paid: false },
    { category: 'venue', description: 'Tent & seating hire', planned_amount: 12000, actual_amount: 0, is_paid: false },
    { category: 'catering', description: 'Food catering', planned_amount: 25000, actual_amount: 0, is_paid: false },
    { category: 'catering', description: 'Traditional beer', planned_amount: 3000, actual_amount: 0, is_paid: false },
    { category: 'decor', description: 'Decor & setup', planned_amount: 8000, actual_amount: 0, is_paid: false },
    { category: 'attire', description: 'Bridal party attire', planned_amount: 10000, actual_amount: 0, is_paid: false },
    { category: 'transport', description: 'Transport', planned_amount: 4000, actual_amount: 0, is_paid: false },
    { category: 'other', description: 'Photography & video', planned_amount: 8000, actual_amount: 0, is_paid: false },
  ];
};
