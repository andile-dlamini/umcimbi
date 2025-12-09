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
  switch (eventType) {
    case 'imbeleko':
      return [
        { title: 'Discuss date with elders', description: 'Coordinate with family elders to set the ceremony date', category: 'other', due_date: null, completed: false, assignee_name: null },
        { title: 'Confirm traditional healer or elder to lead', description: 'Arrange for an elder or healer to conduct the ceremony', category: 'other', due_date: null, completed: false, assignee_name: null },
        { title: 'Arrange goat or alternative offering', description: 'Source the goat or sheep for the ceremony', category: 'livestock', due_date: null, completed: false, assignee_name: null },
        { title: 'Buy groceries and supplies', description: 'Purchase food and essentials for the gathering', category: 'catering', due_date: null, completed: false, assignee_name: null },
        { title: 'Inform close family members', description: 'Send invitations to immediate family', category: 'other', due_date: null, completed: false, assignee_name: null },
        { title: 'Prepare homestead/house for ceremony', description: 'Clean and set up the venue space', category: 'venue', due_date: null, completed: false, assignee_name: null },
      ];

    case 'family_introduction':
      return [
        { title: 'Agree on delegation from each family', description: 'Select representatives for the meeting', category: 'other', due_date: null, completed: false, assignee_name: null },
        { title: 'Set a date and time for the visit', description: 'Coordinate schedules between both families', category: 'other', due_date: null, completed: false, assignee_name: null },
        { title: 'Prepare small gifts or tokens', description: 'Arrange appropriate gifts for the visit', category: 'gifts', due_date: null, completed: false, assignee_name: null },
        { title: 'Confirm venue (home / neutral place)', description: 'Finalize where the meeting will take place', category: 'venue', due_date: null, completed: false, assignee_name: null },
        { title: 'Arrange transport for elders', description: 'Organize transportation for elderly family members', category: 'transport', due_date: null, completed: false, assignee_name: null },
        { title: 'Write down key points to discuss', description: 'Prepare talking points for the meeting', category: 'other', due_date: null, completed: false, assignee_name: null },
      ];

    case 'lobola':
      return [
        { title: 'Choose family representatives (amakhosi / negotiators)', description: 'Select experienced negotiators from the family', category: 'other', due_date: null, completed: false, assignee_name: null },
        { title: 'Agree on proposed date for lobola talks', description: 'Set the date for negotiations', category: 'other', due_date: null, completed: false, assignee_name: null },
        { title: 'Prepare basic discussion notes', description: 'Document key points and expectations', category: 'other', due_date: null, completed: false, assignee_name: null },
        { title: 'Arrange transport for delegation', description: 'Organize transport for the negotiating team', category: 'transport', due_date: null, completed: false, assignee_name: null },
        { title: 'Prepare refreshments', description: 'Arrange drinks and snacks for the meeting', category: 'catering', due_date: null, completed: false, assignee_name: null },
        { title: 'Capture outcomes and agreements after meeting', description: 'Document what was agreed upon', category: 'other', due_date: null, completed: false, assignee_name: null },
      ];

    case 'umembeso':
      return [
        { title: 'Set the date with both families', description: 'Coordinate with both families to agree on a suitable date', category: 'other', due_date: null, completed: false, assignee_name: null },
        { title: 'Confirm venue/homestead', description: 'Confirm the location where the ceremony will take place', category: 'venue', due_date: null, completed: false, assignee_name: null },
        { title: 'Negotiate and finalize gift list (izibizo)', description: 'Work with both families to agree on the gifts required', category: 'gifts', due_date: null, completed: false, assignee_name: null },
        { title: 'Purchase blankets (izingubo)', description: 'Buy the required blankets for the in-laws', category: 'gifts', due_date: null, completed: false, assignee_name: null },
        { title: 'Purchase pinafores and headwraps', description: 'Get the traditional clothing items for mothers and aunts', category: 'gifts', due_date: null, completed: false, assignee_name: null },
        { title: 'Purchase groceries for in-laws', description: 'Buy the food items as part of the gifts', category: 'gifts', due_date: null, completed: false, assignee_name: null },
        { title: 'Arrange transport for gifts', description: 'Organize how gifts will be transported to the homestead', category: 'transport', due_date: null, completed: false, assignee_name: null },
        { title: 'Prepare umakoti attire', description: 'Get the traditional outfit for the bride', category: 'attire', due_date: null, completed: false, assignee_name: null },
        { title: 'Organize refreshments for guests', description: 'Plan food and drinks for attendees', category: 'catering', due_date: null, completed: false, assignee_name: null },
        { title: 'Book photographer', description: 'Find and book a photographer who understands traditional ceremonies', category: 'other', due_date: null, completed: false, assignee_name: null },
      ];

    case 'umbondo':
      return [
        { title: 'Agree on Umbondo date', description: 'Set the date with both families', category: 'other', due_date: null, completed: false, assignee_name: null },
        { title: 'Draft grocery and gifts list', description: 'Plan what groceries and gifts to prepare', category: 'gifts', due_date: null, completed: false, assignee_name: null },
        { title: 'Shop for groceries in bulk', description: 'Purchase all the necessary groceries', category: 'catering', due_date: null, completed: false, assignee_name: null },
        { title: 'Arrange transport to groom\'s family', description: 'Organize delivery of the gifts', category: 'transport', due_date: null, completed: false, assignee_name: null },
        { title: 'Label packages for easier handover', description: 'Organize and label all gift packages', category: 'gifts', due_date: null, completed: false, assignee_name: null },
        { title: 'Confirm who will speak on the day', description: 'Select family spokesperson', category: 'other', due_date: null, completed: false, assignee_name: null },
      ];

    case 'umabo':
      return [
        { title: 'Confirm Umabo date and venue', description: 'Set the wedding date and confirm homestead', category: 'venue', due_date: null, completed: false, assignee_name: null },
        { title: 'Book tents and seating', description: 'Hire tents, chairs, and tables for guests', category: 'venue', due_date: null, completed: false, assignee_name: null },
        { title: 'Confirm cattle (inkomo) arrangements', description: 'Arrange for the required cattle for the ceremony', category: 'livestock', due_date: null, completed: false, assignee_name: null },
        { title: 'Arrange goat for ceremonies', description: 'Source a goat for traditional rituals', category: 'livestock', due_date: null, completed: false, assignee_name: null },
        { title: 'Arrange catering', description: 'Book catering for traditional food including pap, meat, and salads', category: 'catering', due_date: null, completed: false, assignee_name: null },
        { title: 'Order traditional beer (utshwala)', description: 'Arrange for traditional beer to be brewed or purchased', category: 'catering', due_date: null, completed: false, assignee_name: null },
        { title: 'Plan decor setup', description: 'Organize traditional decorations, umbrellas, and mats', category: 'decor', due_date: null, completed: false, assignee_name: null },
        { title: 'Prepare bridal party attire', description: 'Coordinate traditional outfits for the wedding party', category: 'attire', due_date: null, completed: false, assignee_name: null },
        { title: 'Book transport for bridal party', description: 'Arrange transport to and from the venue', category: 'transport', due_date: null, completed: false, assignee_name: null },
        { title: 'Prepare izibongo (praise songs)', description: 'Work with elders on the praise songs for the ceremony', category: 'other', due_date: null, completed: false, assignee_name: null },
        { title: 'Book photographer/videographer', description: 'Find and book someone to capture the day', category: 'other', due_date: null, completed: false, assignee_name: null },
        { title: 'Prepare program for the day', description: 'Plan the sequence of events', category: 'other', due_date: null, completed: false, assignee_name: null },
      ];

    case 'umemulo':
      return [
        { title: 'Set Umemulo date', description: 'Agree on the ceremony date', category: 'other', due_date: null, completed: false, assignee_name: null },
        { title: 'Confirm cow for the ceremony', description: 'Arrange for the cow to be slaughtered', category: 'livestock', due_date: null, completed: false, assignee_name: null },
        { title: 'Plan decor and seating', description: 'Organize decorations and seating arrangements', category: 'decor', due_date: null, completed: false, assignee_name: null },
        { title: 'Organize outfits for celebrant and attendants', description: 'Get traditional attire for the coming-of-age celebration', category: 'attire', due_date: null, completed: false, assignee_name: null },
        { title: 'Hire music/band', description: 'Book entertainment for the celebration', category: 'other', due_date: null, completed: false, assignee_name: null },
        { title: 'Prepare program (speeches, dances, thanks)', description: 'Plan the order of events for the day', category: 'other', due_date: null, completed: false, assignee_name: null },
        { title: 'Invite family and friends', description: 'Send out invitations', category: 'other', due_date: null, completed: false, assignee_name: null },
        { title: 'Arrange catering', description: 'Plan food and refreshments', category: 'catering', due_date: null, completed: false, assignee_name: null },
      ];

    case 'funeral':
      return [
        { title: 'Contact funeral parlour', description: 'Arrange funeral services', category: 'other', due_date: null, completed: false, assignee_name: null },
        { title: 'Confirm burial date and time', description: 'Set the date for the funeral', category: 'other', due_date: null, completed: false, assignee_name: null },
        { title: 'Coordinate with church/spiritual leader', description: 'Arrange for the service conductor', category: 'other', due_date: null, completed: false, assignee_name: null },
        { title: 'Arrange tents and seating', description: 'Hire tents and chairs for attendees', category: 'venue', due_date: null, completed: false, assignee_name: null },
        { title: 'Arrange catering / refreshments', description: 'Plan food for after the funeral', category: 'catering', due_date: null, completed: false, assignee_name: null },
        { title: 'Organize transport for family and elders', description: 'Arrange transportation', category: 'transport', due_date: null, completed: false, assignee_name: null },
        { title: 'Prepare funeral program', description: 'Create the order of service', category: 'other', due_date: null, completed: false, assignee_name: null },
        { title: 'Plan post-funeral gathering at home', description: 'Organize the after-tears gathering', category: 'other', due_date: null, completed: false, assignee_name: null },
      ];

    case 'ancestral_ritual':
      return [
        { title: 'Identify purpose of the ritual', description: 'Clarify the intention behind the ceremony', category: 'other', due_date: null, completed: false, assignee_name: null },
        { title: 'Consult with elder or traditional healer', description: 'Get guidance on the ritual requirements', category: 'other', due_date: null, completed: false, assignee_name: null },
        { title: 'Choose suitable date', description: 'Set the ceremony date', category: 'other', due_date: null, completed: false, assignee_name: null },
        { title: 'Buy required items (e.g. candles, herbs, goat)', description: 'Gather all necessary ritual items', category: 'livestock', due_date: null, completed: false, assignee_name: null },
        { title: 'Inform participating family members', description: 'Notify all who should attend', category: 'other', due_date: null, completed: false, assignee_name: null },
        { title: 'Prepare space for the ritual', description: 'Set up the area where the ritual will take place', category: 'venue', due_date: null, completed: false, assignee_name: null },
      ];

    default:
      return [];
  }
};

export const getDefaultBudgetItems = (eventId: string, eventType: EventType): BudgetTemplate[] => {
  switch (eventType) {
    case 'imbeleko':
      return [
        { category: 'livestock', description: 'Goat / sheep', planned_amount: 0, actual_amount: 0, is_paid: false },
        { category: 'catering', description: 'Food and refreshments', planned_amount: 0, actual_amount: 0, is_paid: false },
        { category: 'healer_services', description: 'Traditional healer / elder', planned_amount: 0, actual_amount: 0, is_paid: false },
      ];

    case 'family_introduction':
      return [
        { category: 'catering', description: 'Snacks / refreshments', planned_amount: 0, actual_amount: 0, is_paid: false },
        { category: 'transport', description: 'Transport for delegation', planned_amount: 0, actual_amount: 0, is_paid: false },
        { category: 'gifts', description: 'Small gifts / tokens', planned_amount: 0, actual_amount: 0, is_paid: false },
      ];

    case 'lobola':
      return [
        { category: 'catering', description: 'Refreshments for lobola negotiations', planned_amount: 0, actual_amount: 0, is_paid: false },
        { category: 'transport', description: 'Travel costs for delegation', planned_amount: 0, actual_amount: 0, is_paid: false },
        { category: 'other', description: 'Gifts / tokens', planned_amount: 0, actual_amount: 0, is_paid: false },
      ];

    case 'umembeso':
      return [
        { category: 'gifts', description: 'Blankets (izingubo)', planned_amount: 3000, actual_amount: 0, is_paid: false },
        { category: 'gifts', description: 'Pinafores & headwraps', planned_amount: 2000, actual_amount: 0, is_paid: false },
        { category: 'gifts', description: 'Groceries for in-laws', planned_amount: 5000, actual_amount: 0, is_paid: false },
        { category: 'attire', description: 'Umakoti outfit', planned_amount: 2500, actual_amount: 0, is_paid: false },
        { category: 'transport', description: 'Gift transport', planned_amount: 1500, actual_amount: 0, is_paid: false },
        { category: 'catering', description: 'Refreshments', planned_amount: 3000, actual_amount: 0, is_paid: false },
        { category: 'decor', description: 'Decor and seating', planned_amount: 2000, actual_amount: 0, is_paid: false },
        { category: 'other', description: 'Photography', planned_amount: 3500, actual_amount: 0, is_paid: false },
      ];

    case 'umbondo':
      return [
        { category: 'catering', description: 'Umbondo groceries', planned_amount: 0, actual_amount: 0, is_paid: false },
        { category: 'transport', description: 'Delivery transport', planned_amount: 0, actual_amount: 0, is_paid: false },
        { category: 'gifts', description: 'Additional gifts', planned_amount: 0, actual_amount: 0, is_paid: false },
      ];

    case 'umabo':
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

    case 'umemulo':
      return [
        { category: 'livestock', description: 'Cow for Umemulo', planned_amount: 0, actual_amount: 0, is_paid: false },
        { category: 'decor', description: 'Decor and seating', planned_amount: 0, actual_amount: 0, is_paid: false },
        { category: 'music', description: 'Band / sound system', planned_amount: 0, actual_amount: 0, is_paid: false },
        { category: 'catering', description: 'Food / refreshments', planned_amount: 0, actual_amount: 0, is_paid: false },
        { category: 'attire', description: 'Outfits (celebrant and attendants)', planned_amount: 0, actual_amount: 0, is_paid: false },
      ];

    case 'funeral':
      return [
        { category: 'funeral_services', description: 'Funeral parlour services', planned_amount: 0, actual_amount: 0, is_paid: false },
        { category: 'venue', description: 'Tents and chairs', planned_amount: 0, actual_amount: 0, is_paid: false },
        { category: 'catering', description: 'Food after funeral', planned_amount: 0, actual_amount: 0, is_paid: false },
        { category: 'transport', description: 'Hearse and family transport', planned_amount: 0, actual_amount: 0, is_paid: false },
        { category: 'other', description: 'Funeral programs (printing)', planned_amount: 0, actual_amount: 0, is_paid: false },
      ];

    case 'ancestral_ritual':
      return [
        { category: 'livestock', description: 'Goat / other offering', planned_amount: 0, actual_amount: 0, is_paid: false },
        { category: 'catering', description: 'Food for participants', planned_amount: 0, actual_amount: 0, is_paid: false },
        { category: 'healer_services', description: 'Healer / spiritual advisor', planned_amount: 0, actual_amount: 0, is_paid: false },
      ];

    default:
      return [];
  }
};
