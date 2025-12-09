import { Task, BudgetItem, EventType } from '@/types';

export const getDefaultTasks = (eventId: string, eventType: EventType): Omit<Task, 'id'>[] => {
  const baseTasks: Omit<Task, 'id'>[] = [
    {
      eventId,
      title: 'Set the date with both families',
      description: 'Coordinate with both families to agree on a suitable date',
      category: 'other',
      dueDate: null,
      completed: false,
      assigneeName: '',
    },
    {
      eventId,
      title: 'Confirm venue/homestead',
      description: 'Confirm the location where the ceremony will take place',
      category: 'venue',
      dueDate: null,
      completed: false,
      assigneeName: '',
    },
    {
      eventId,
      title: 'Book photographer',
      description: 'Find and book a photographer who understands traditional ceremonies',
      category: 'other',
      dueDate: null,
      completed: false,
      assigneeName: '',
    },
  ];

  if (eventType === 'umembeso') {
    return [
      ...baseTasks,
      {
        eventId,
        title: 'Negotiate and finalize gift list (izibizo)',
        description: 'Work with both families to agree on the gifts required',
        category: 'gifts',
        dueDate: null,
        completed: false,
        assigneeName: '',
      },
      {
        eventId,
        title: 'Purchase blankets (izingubo)',
        description: 'Buy the required blankets for the in-laws',
        category: 'gifts',
        dueDate: null,
        completed: false,
        assigneeName: '',
      },
      {
        eventId,
        title: 'Purchase pinafores and headwraps',
        description: 'Get the traditional clothing items for mothers and aunts',
        category: 'gifts',
        dueDate: null,
        completed: false,
        assigneeName: '',
      },
      {
        eventId,
        title: 'Purchase groceries for in-laws',
        description: 'Buy the food items as part of the gifts',
        category: 'gifts',
        dueDate: null,
        completed: false,
        assigneeName: '',
      },
      {
        eventId,
        title: 'Arrange transport for gifts',
        description: 'Organize how gifts will be transported to the homestead',
        category: 'transport',
        dueDate: null,
        completed: false,
        assigneeName: '',
      },
      {
        eventId,
        title: 'Prepare umakoti attire',
        description: 'Get the traditional outfit for the bride',
        category: 'attire',
        dueDate: null,
        completed: false,
        assigneeName: '',
      },
      {
        eventId,
        title: 'Organize refreshments for guests',
        description: 'Plan food and drinks for attendees',
        category: 'catering',
        dueDate: null,
        completed: false,
        assigneeName: '',
      },
    ];
  }

  // Umabo tasks
  return [
    ...baseTasks,
    {
      eventId,
      title: 'Confirm cattle (inkomo) arrangements',
      description: 'Arrange for the required cattle for the ceremony',
      category: 'livestock',
      dueDate: null,
      completed: false,
      assigneeName: '',
    },
    {
      eventId,
      title: 'Book tent and seating',
      description: 'Hire tents, chairs, and tables for guests',
      category: 'venue',
      dueDate: null,
      completed: false,
      assigneeName: '',
    },
    {
      eventId,
      title: 'Arrange catering',
      description: 'Book catering for traditional food including pap, meat, and salads',
      category: 'catering',
      dueDate: null,
      completed: false,
      assigneeName: '',
    },
    {
      eventId,
      title: 'Order traditional beer (utshwala)',
      description: 'Arrange for traditional beer to be brewed or purchased',
      category: 'catering',
      dueDate: null,
      completed: false,
      assigneeName: '',
    },
    {
      eventId,
      title: 'Plan decor setup',
      description: 'Organize traditional decorations, umbrellas, and mats',
      category: 'decor',
      dueDate: null,
      completed: false,
      assigneeName: '',
    },
    {
      eventId,
      title: 'Prepare bridal party attire',
      description: 'Coordinate traditional outfits for the wedding party',
      category: 'attire',
      dueDate: null,
      completed: false,
      assigneeName: '',
    },
    {
      eventId,
      title: 'Arrange goat for ceremonies',
      description: 'Source a goat for traditional rituals',
      category: 'livestock',
      dueDate: null,
      completed: false,
      assigneeName: '',
    },
    {
      eventId,
      title: 'Book transport for bridal party',
      description: 'Arrange transport to and from the venue',
      category: 'transport',
      dueDate: null,
      completed: false,
      assigneeName: '',
    },
    {
      eventId,
      title: 'Prepare izibongo (praise songs)',
      description: 'Work with elders on the praise songs for the ceremony',
      category: 'other',
      dueDate: null,
      completed: false,
      assigneeName: '',
    },
  ];
};

export const getDefaultBudgetItems = (eventId: string, eventType: EventType): Omit<BudgetItem, 'id'>[] => {
  if (eventType === 'umembeso') {
    return [
      { eventId, category: 'gifts', description: 'Blankets (izingubo)', plannedAmount: 3000, actualAmount: 0, isPaid: false },
      { eventId, category: 'gifts', description: 'Pinafores & headwraps', plannedAmount: 2000, actualAmount: 0, isPaid: false },
      { eventId, category: 'gifts', description: 'Groceries for in-laws', plannedAmount: 5000, actualAmount: 0, isPaid: false },
      { eventId, category: 'attire', description: 'Umakoti outfit', plannedAmount: 2500, actualAmount: 0, isPaid: false },
      { eventId, category: 'transport', description: 'Gift transport', plannedAmount: 1500, actualAmount: 0, isPaid: false },
      { eventId, category: 'catering', description: 'Refreshments', plannedAmount: 3000, actualAmount: 0, isPaid: false },
      { eventId, category: 'other', description: 'Photography', plannedAmount: 3500, actualAmount: 0, isPaid: false },
    ];
  }

  // Umabo budget
  return [
    { eventId, category: 'livestock', description: 'Cattle (inkomo)', plannedAmount: 15000, actualAmount: 0, isPaid: false },
    { eventId, category: 'livestock', description: 'Goat for rituals', plannedAmount: 2500, actualAmount: 0, isPaid: false },
    { eventId, category: 'venue', description: 'Tent & seating hire', plannedAmount: 12000, actualAmount: 0, isPaid: false },
    { eventId, category: 'catering', description: 'Food catering', plannedAmount: 25000, actualAmount: 0, isPaid: false },
    { eventId, category: 'catering', description: 'Traditional beer', plannedAmount: 3000, actualAmount: 0, isPaid: false },
    { eventId, category: 'decor', description: 'Decor & setup', plannedAmount: 8000, actualAmount: 0, isPaid: false },
    { eventId, category: 'attire', description: 'Bridal party attire', plannedAmount: 10000, actualAmount: 0, isPaid: false },
    { eventId, category: 'transport', description: 'Transport', plannedAmount: 4000, actualAmount: 0, isPaid: false },
    { eventId, category: 'other', description: 'Photography & video', plannedAmount: 8000, actualAmount: 0, isPaid: false },
  ];
};