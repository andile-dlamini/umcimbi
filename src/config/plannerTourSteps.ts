import type { TourStep } from '@/components/onboarding/OnboardingTour';

export const PLANNER_TOUR_STEPS: TourStep[] = [
  {
    target: 'center',
    placement: 'center',
    title: 'Welcome to Umcimbi!',
    body: "Umcimbi connects families planning traditional Zulu ceremonies with trusted, vetted vendors. Let's take 2 minutes to show you how everything works.",
  },
  {
    target: '[data-tour="planner-ceremonies"]',
    placement: 'bottom',
    title: 'Start by choosing a ceremony',
    body: "Each tile represents a ceremony type — Lobola, Umabo, Umemulo, and more. Tap any one to create an event and start planning. Umcimbi will guide you through every step.",
  },
  {
    target: '[data-tour="nav-events"]',
    placement: 'right',
    title: 'All your events in one place',
    body: "Once you've created an event, you'll find it here. Each event has its own planning checklist, vendor list, budget tracker, and timeline to keep everything organised.",
  },
  {
    target: '[data-tour="nav-vendors"]',
    placement: 'right',
    title: 'Browse & contact vendors',
    body: "Search for caterers, photographers, décor hire, MCs, and more — all vetted and based in your area. View their profiles, pricing, and reviews, then send them a request.",
  },
  {
    target: '[data-tour="nav-messages"]',
    placement: 'right',
    title: 'All conversations in one inbox',
    body: "When a vendor responds to your request, the conversation appears here. Discuss your requirements, ask questions, and receive their formal quotation — all in one place.",
  },
  {
    target: '[data-tour="nav-quotes"]',
    placement: 'right',
    title: 'Compare and accept quotations',
    body: "When a vendor sends you a quote, it lands here. You can compare quotes side by side before accepting. Accepting a quote creates a confirmed booking.",
  },
  {
    target: '[data-tour="nav-orders"]',
    placement: 'right',
    title: 'Your confirmed bookings',
    body: "Once you accept a quote, the booking appears here. Umcimbi collects the deposit immediately and holds the balance in escrow — your money is protected until the ceremony is done.",
  },
  {
    target: 'center',
    placement: 'center',
    title: "You're ready to start planning!",
    body: "Begin by selecting a ceremony type on the home page. The more detail you add to your event, the easier it is for vendors to give you accurate quotes. Good luck!",
  },
];
