import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { RoleProvider } from "@/context/RoleContext";
import { BottomNav } from "@/components/layout/BottomNav";

// Pages
import OnboardingLanguage from "@/pages/onboarding/OnboardingLanguage";
import AuthPage from "@/pages/auth/AuthPage";
import CompleteProfile from "@/pages/profile/CompleteProfile";
import Home from "@/pages/Home";
import EventsList from "@/pages/events/EventsList";
import CreateEvent from "@/pages/events/CreateEvent";
import EventDashboard from "@/pages/events/EventDashboard";
import CeremonyMode from "@/pages/events/CeremonyMode";
import VendorsList from "@/pages/vendors/VendorsList";
import VendorDetail from "@/pages/vendors/VendorDetail";
import VendorOnboarding from "@/pages/vendors/VendorOnboarding";
import VendorProfile from "@/pages/profile/VendorProfile";
import VendorDashboard from "@/pages/vendor-dashboard/VendorDashboard";
import MyRequests from "@/pages/profile/MyRequests";
import Learn from "@/pages/Learn";
import ArticlePage from "@/pages/learn/ArticlePage";
import Profile from "@/pages/Profile";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ChatsList from "@/pages/chat/ChatsList";
import ChatThread from "@/pages/chat/ChatThread";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, isLoading, isProfileComplete } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingLanguage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  // Logged in but profile not complete
  if (!isProfileComplete) {
    return (
      <Routes>
        <Route path="/profile/complete" element={<CompleteProfile />} />
        <Route path="*" element={<Navigate to="/profile/complete" replace />} />
      </Routes>
    );
  }

  // Fully authenticated
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<EventsList />} />
        <Route path="/events/new" element={<CreateEvent />} />
        <Route path="/events/:id" element={<EventDashboard />} />
        <Route path="/events/:id/ceremony-mode" element={<CeremonyMode />} />
        <Route path="/vendors" element={<VendorsList />} />
        <Route path="/vendors/onboarding" element={<VendorOnboarding />} />
        <Route path="/vendors/:id" element={<VendorDetail />} />
        <Route path="/chats" element={<ChatsList />} />
        <Route path="/chat/:conversationId" element={<ChatThread />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/learn/:articleId" element={<ArticlePage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/complete" element={<CompleteProfile />} />
        <Route path="/profile/vendor" element={<VendorProfile />} />
        <Route path="/profile/requests" element={<MyRequests />} />
        <Route path="/vendor-dashboard" element={<VendorDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/onboarding" element={<Navigate to="/" replace />} />
        <Route path="/auth" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RoleProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </RoleProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;