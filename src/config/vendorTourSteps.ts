import type { TourStep } from '@/components/onboarding/OnboardingTour';

export const VENDOR_TOUR_STEPS: TourStep[] = [
  {
    target: 'center',
    placement: 'center',
    title: 'Welcome to your vendor account!',
    body: "You're now part of Umcimbi's vendor network. Let's walk you through your dashboard so you know exactly what to do when your first booking request arrives.",
  },
  {
    target: '[data-tour="nav-vendor-home"]',
    placement: 'right',
    navigateTo: '/vendor-dashboard',
    title: 'Your vendor dashboard',
    body: 'This is your home as a vendor. It shows your performance stats and quick links to manage your profile. You will land here every time you log in.',
  },
  {
    target: '[data-tour="vendor-kpis"]',
    placement: 'bottom',
    navigateTo: '/vendor-dashboard',
    title: 'Your performance at a glance',
    body: "These four numbers track your last 30 days — profile views, quotations sent, completed orders, and total payout. When all four are growing, your listing is working.",
  },
  {
    target: '[data-tour="vendor-quick-links"]',
    placement: 'top',
    navigateTo: '/vendor-dashboard',
    title: 'Complete your profile first',
    body: "Your profile is your storefront. Families choose vendors based on your photo, description, services, and pricing. Tap 'Edit profile' to fill everything in — the more complete it is, the higher you rank in search.",
  },
  {
    target: '[data-tour="nav-messages"]',
    placement: 'right',
    navigateTo: '/chats',
    title: 'Booking requests arrive here',
    body: "When a family is interested in your services, they send you a message. A badge will appear on this icon. Open the chat, understand their requirements, and send your formal quotation from within the conversation.",
  },
  {
    target: '[data-tour="nav-vendor-quotations"]',
    placement: 'right',
    navigateTo: '/vendor-dashboard/quotations',
    title: 'Track your sent quotations',
    body: "Every quotation you send appears here — you can see whether the client is still reviewing it, has accepted it, or has declined. Accepted quotes automatically become confirmed bookings.",
  },
  {
    target: '[data-tour="nav-vendor-orders"]',
    placement: 'right',
    navigateTo: '/vendor-dashboard/orders',
    title: 'Your confirmed bookings',
    body: "Confirmed bookings live here. You can track deposit and balance payment status for each one. When the ceremony is done, mark the job complete from this screen to trigger your payout.",
  },
  {
    target: 'center',
    placement: 'center',
    title: 'How your payment works',
    body: "Umcimbi holds all payments safely in escrow. A deposit is collected when a booking is confirmed, and the full balance 5 days before the ceremony. After the event, upload proof of delivery and your payout is sent straight to your bank account — no chasing clients for payment.",
  },
  {
    target: 'center',
    placement: 'center',
    navigateTo: '/vendor-dashboard',
    title: "You're all set!",
    body: "Start by completing your profile so families can find you. You can replay this tour at any time from your Settings page.",
  },
];
