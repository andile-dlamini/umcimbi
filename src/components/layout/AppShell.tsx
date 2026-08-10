import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { InstallPrompt } from '@/components/shared/InstallPrompt';
import { FeedbackButton } from '@/components/feedback/FeedbackButton';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';
import { PLANNER_TOUR_STEPS } from '@/config/plannerTourSteps';
import { VENDOR_TOUR_STEPS } from '@/config/vendorTourSteps';

interface AppShellProps {
  children: ReactNode;
  updateAvailable?: boolean;
}

/** Pages that should NOT show the sidebar */
const HIDE_NAV_ROUTES = ['/onboarding', '/auth', '/chat/'];

function TourController() {
  const { isVendor } = useAuth();
  const { activeRole } = useRole();
  const isInVendorMode = isVendor && activeRole === 'vendor';

  const planner = useOnboardingTour('planner');
  const vendor = useOnboardingTour('vendor');

  if (isInVendorMode && vendor.tourActive) {
    return <OnboardingTour steps={VENDOR_TOUR_STEPS} onComplete={vendor.completeTour} />;
  }
  if (!isInVendorMode && planner.tourActive) {
    return <OnboardingTour steps={PLANNER_TOUR_STEPS} onComplete={planner.completeTour} />;
  }
  return null;
}

export function AppShell({ children, updateAvailable = false }: AppShellProps) {
  const location = useLocation();
  const isMobile = useIsMobile();

  const hideNav = HIDE_NAV_ROUTES.some(r =>
    location.pathname === r || location.pathname.startsWith(r)
  );

  // Bottom spacing for the update banner is applied app-wide in App.tsx.
  const bannerPad = '';

  if (hideNav) return <div className={bannerPad}>{children}</div>;

  return (
    <div className={`flex min-h-screen w-full ${bannerPad}`}>
      <AppSidebar />
      <main className={`flex-1 min-w-0 ${isMobile ? 'ml-14' : ''}`}>
        {children}
      </main>
      <InstallPrompt />
      <FeedbackButton />
      <TourController />
    </div>
  );
}
