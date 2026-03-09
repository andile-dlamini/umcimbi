import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, FileText, CheckCircle, Store, TrendingUp, Banknote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { useVendorQuotes } from '@/hooks/useQuotes';
import { useVendorBookings } from '@/hooks/useBookings';
import { subDays, isAfter } from 'date-fns';

export default function VendorDashboard() {
  const navigate = useNavigate();
  const { vendorProfile } = useAuth();
  const { quotes, isLoading: quotesLoading } = useVendorQuotes();
  const { bookings, isLoading: bookingsLoading } = useVendorBookings();

  const isLoading = quotesLoading || bookingsLoading;
  const thirtyDaysAgo = subDays(new Date(), 30);

  if (!vendorProfile) {
    return (
      <div className="min-h-screen">
        <PageHeader title="Dashboard" showBack />
        <div className="px-4 py-12 text-center">
          <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">No vendor profile</h2>
          <p className="text-muted-foreground mb-6">Register as a vendor to access this dashboard</p>
          <Button onClick={() => navigate('/vendors/onboarding')}>Become a vendor</Button>
        </div>
      </div>
    );
  }

  const kpis = useMemo(() => {
    // Profile views (all-time since we don't have date tracking on views)
    const profileViews = vendorProfile.view_count || 0;

    // Quotes sent in last 30 days
    const quotesSent = quotes.filter(q =>
      isAfter(new Date(q.created_at), thirtyDaysAgo)
    ).length;

    // Orders completed in last 30 days
    const ordersCompleted = bookings.filter(b =>
      b.booking_status === 'completed' &&
      b.updated_at &&
      isAfter(new Date(b.updated_at), thirtyDaysAgo)
    ).length;

    // Total payout in last 30 days (sum of agreed_price for completed bookings)
    const totalPayout = bookings
      .filter(b =>
        b.booking_status === 'completed' &&
        b.updated_at &&
        isAfter(new Date(b.updated_at), thirtyDaysAgo)
      )
      .reduce((sum, b) => sum + (b.agreed_price || 0), 0);

    return { profileViews, quotesSent, ordersCompleted, totalPayout };
  }, [vendorProfile, quotes, bookings, thirtyDaysAgo]);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Dashboard" />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* 30-Day KPI Grid */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-muted-foreground">Last 30 days</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {isLoading ? '–' : kpis.profileViews}
                  </p>
                  <p className="text-xs text-muted-foreground">Profile views</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {isLoading ? '–' : kpis.quotesSent}
                  </p>
                  <p className="text-xs text-muted-foreground">Quotes sent</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {isLoading ? '–' : kpis.ordersCompleted}
                  </p>
                  <p className="text-xs text-muted-foreground">Orders done</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Banknote className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {isLoading ? '–' : `R${kpis.totalPayout.toLocaleString()}`}
                  </p>
                  <p className="text-xs text-muted-foreground">Total payout</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-auto py-3" onClick={() => navigate('/profile/vendor')}>
            <Store className="h-4 w-4 mr-2" />
            Edit profile
          </Button>
          <Button variant="outline" className="h-auto py-3" onClick={() => navigate(`/vendors/${vendorProfile.id}`)}>
            <Eye className="h-4 w-4 mr-2" />
            View public page
          </Button>
        </div>
      </div>
    </div>
  );
}
