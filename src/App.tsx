import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { RoleProvider } from "@/context/RoleContext";
import { AppShell } from "@/components/layout/AppShell";

// Pages
import OnboardingLanguage from "@/pages/onboarding/OnboardingLanguage";
import AuthPage from "@/pages/auth/AuthPage";
import AuthCallback from "@/pages/auth/AuthCallback";
import ContactPage from "@/pages/contact/ContactPage";
import PrivacyPolicy from "@/pages/legal/PrivacyPolicy";
import TermsOfService from "@/pages/legal/TermsOfService";
import WaitlistPage from "@/pages/WaitlistPage";

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
import VendorRequests from "@/pages/vendor-dashboard/VendorRequests";
import VendorBookings from "@/pages/vendor-dashboard/VendorBookings";
import VendorQuotations from "@/pages/vendor-dashboard/VendorQuotations";
import VendorOrders from "@/pages/vendor-dashboard/VendorOrders";
import MyRequests from "@/pages/profile/MyRequests";
import MyQuotes from "@/pages/quotes/MyQuotes";
import CompareQuotes from "@/pages/quotes/CompareQuotes";
import ClientBookings from "@/pages/bookings/ClientBookings";
import BookingDetail from "@/pages/bookings/BookingDetail";
import Learn from "@/pages/Learn";
import ArticlePage from "@/pages/learn/ArticlePage";
import SettingsPage from "@/pages/Settings";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import BulkVendorUpload from "@/pages/admin/BulkVendorUpload";
import VendorVerificationQueue from "@/pages/admin/VendorVerificationQueue";
import SuperVendorManagement from "@/pages/admin/SuperVendorManagement";
import AdminInsights from "@/pages/admin/AdminInsights";
import AdminOperations from "@/pages/admin/AdminOperations";
import AdminRevenue from "@/pages/admin/AdminRevenue";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminWaitlist from "@/pages/admin/AdminWaitlist";
import AdminLayout from "@/components/admin/AdminLayout";
import ChatsList from "@/pages/chat/ChatsList";
import ChatThread from "@/pages/chat/ChatThread";
import PaymentSuccess from "@/pages/payment/PaymentSuccess";
import PaymentError from "@/pages/payment/PaymentError";
import PaymentCancel from "@/pages/payment/PaymentCancel";
import NotFound from "@/pages/NotFound";
import { AdminGuard } from "@/components/layout/AdminGuard";

const queryClient = new QueryClient();

// Redirect component that preserves ref param for vendor join
const VendorJoinRedirect = () => {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref');
  const to = `/auth?mode=signup&role=vendor${ref ? `&ref=${ref}` : ''}`;
  return <Navigate to={to} replace />;
};

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
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/waitlist" element={<WaitlistPage />} />
        <Route path="/join/vendor" element={<VendorJoinRedirect />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  // Fully authenticated
  return (
    <AppShell>
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
        <Route path="/settings" element={<SettingsPage />} />
        {/* Legacy profile route redirects to settings */}
        <Route path="/profile" element={<Navigate to="/settings" replace />} />
        
        <Route path="/profile/vendor" element={<VendorProfile />} />
        <Route path="/profile/requests" element={<MyRequests />} />
        <Route path="/quotes" element={<MyQuotes />} />
        <Route path="/quotes/compare" element={<CompareQuotes />} />
        <Route path="/bookings" element={<ClientBookings />} />
        <Route path="/bookings/:bookingId" element={<BookingDetail />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/error" element={<PaymentError />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />
        <Route path="/vendor-dashboard" element={<VendorDashboard />} />
        <Route path="/vendor-dashboard/requests" element={<VendorRequests />} />
        <Route path="/vendor-dashboard/bookings" element={<VendorBookings />} />
        <Route path="/vendor-dashboard/quotations" element={<VendorQuotations />} />
        <Route path="/vendor-dashboard/orders" element={<VendorOrders />} />
        <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
          <Route index element={<AdminDashboard />} />
          <Route path="insights" element={<AdminInsights />} />
          <Route path="revenue" element={<AdminRevenue />} />
          <Route path="operations" element={<AdminOperations />} />
          <Route path="bulk-vendors" element={<BulkVendorUpload />} />
          <Route path="verification-queue" element={<VendorVerificationQueue />} />
          <Route path="super-vendors" element={<SuperVendorManagement />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="waitlist" element={<AdminWaitlist />} />
        </Route>
        <Route path="/onboarding" element={<Navigate to="/" replace />} />
        <Route path="/auth" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
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
