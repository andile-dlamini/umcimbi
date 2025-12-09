import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "@/context/AppContext";
import { BottomNav } from "@/components/layout/BottomNav";

// Pages
import OnboardingLanguage from "@/pages/onboarding/OnboardingLanguage";
import OnboardingLogin from "@/pages/onboarding/OnboardingLogin";
import Home from "@/pages/Home";
import EventsList from "@/pages/events/EventsList";
import CreateEvent from "@/pages/events/CreateEvent";
import EventDashboard from "@/pages/events/EventDashboard";
import CeremonyMode from "@/pages/events/CeremonyMode";
import VendorsList from "@/pages/vendors/VendorsList";
import VendorDetail from "@/pages/vendors/VendorDetail";
import Learn from "@/pages/Learn";
import UmembesoBasics from "@/pages/learn/UmembesoBasics";
import UmaboGuide from "@/pages/learn/UmaboGuide";
import CombiningCeremonies from "@/pages/learn/CombiningCeremonies";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isOnboarded } = useApp();

  if (!isOnboarded) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingLanguage />} />
        <Route path="/onboarding/login" element={<OnboardingLogin />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<EventsList />} />
        <Route path="/events/new" element={<CreateEvent />} />
        <Route path="/events/:id" element={<EventDashboard />} />
        <Route path="/events/:id/ceremony-mode" element={<CeremonyMode />} />
        <Route path="/vendors" element={<VendorsList />} />
        <Route path="/vendors/:id" element={<VendorDetail />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/learn/umembeso" element={<UmembesoBasics />} />
        <Route path="/learn/umabo" element={<UmaboGuide />} />
        <Route path="/learn/combining-ceremonies" element={<CombiningCeremonies />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/onboarding" element={<Navigate to="/" replace />} />
        <Route path="/onboarding/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;