import { useState, useEffect } from 'react';
import { Store, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { SmsBalanceCard } from '@/components/admin/SmsBalanceCard';

const PLATFORM_FEE_RATE = 0.08;

type Period = 'week' | 'month' | 'all';

function getPeriodDates(period: Period) {
  const now = Date.now();
  if (period === 'all') return { start: null, prevStart: null };
  const ms = period === 'week' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
  const start = new Date(now - ms).toISOString();
  const prevStart = new Date(now - 2 * ms).toISOString();
  return { start, prevStart };
}

const formatRand = (v: number) =>
  `R ${v.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const categoryLabels: Record<string, string> = {
  decor: 'Decor', catering: 'Catering', livestock: 'Livestock', tents: 'Tents',
  transport: 'Transport', attire: 'Attire', photographer: 'Photography',
  invitations_stationery: 'Invitations', makeup_beauty: 'Makeup & Beauty',
  cold_room_hire: 'Cold Room Hire', mobile_toilets: 'Mobile Toilets',
  attire_tailoring: 'Attire Tailoring', drinks_ice_delivery: 'Drinks & Ice',
  cakes_baking: 'Cakes & Baking', dj_sound_audio: 'DJ & Sound', florist: 'Florist', other: 'Other',
};

const eventTypeLabels: Record<string, string> = {
  lobola: 'Lobola', umembeso: 'Umembeso', umbondo: 'Umbondo', umabo: 'Umabo',
  umemulo: 'Umemulo', imbeleko: 'Imbeleko', ancestral_ritual: 'Ancestral Ritual',
};

export default function AdminDashboard() {
  const [period, setPeriod] = useState<Period>('month');
  const [isLoading, setIsLoading] = useState(true);

  // Revenue data
  const [gmv, setGmv] = useState(0);
  const [platformRevenue, setPlatformRevenue] = useState(0);
  const [escrow, setEscrow] = useState(0);
  const [avgBooking, setAvgBooking] = useState(0);

  // Growth signals
  const [newOrganisers, setNewOrganisers] = useState(0);
  const [prevOrganisers, setPrevOrganisers] = useState(0);
  const [newCeremonies, setNewCeremonies] = useState(0);
  const [prevCeremonies, setPrevCeremonies] = useState(0);
  const [newRequests, setNewRequests] = useState(0);
  const [prevRequests, setPrevRequests] = useState(0);
  const [newBookings, setNewBookings] = useState(0);
  const [prevBookings, setPrevBookings] = useState(0);

  // Funnel (always all-time)
  const [funnelRegistered, setFunnelRegistered] = useState(0);
  const [funnelCreated, setFunnelCreated] = useState(0);
  const [funnelRequested, setFunnelRequested] = useState(0);
  const [funnelBooked, setFunnelBooked] = useState(0);

  // Distribution
  const [eventsByType, setEventsByType] = useState<Record<string, number>>({});
  const [vendorsByCategory, setVendorsByCategory] = useState<Record<string, number>>({});
  const [totalEvents, setTotalEvents] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      const { start, prevStart } = getPeriodDates(period);

      // Tier 1 — Revenue
      let bookingsQuery = supabase
        .from('bookings')
        .select('agreed_price')
        .in('booking_status', ['confirmed', 'completed', 'disputed']);
      if (start) bookingsQuery = bookingsQuery.gte('created_at', start);
      const { data: revenueBookings } = await bookingsQuery;

      const gmvVal = (revenueBookings || []).reduce((s, b) => s + Number(b.agreed_price), 0);
      const revVal = (revenueBookings || []).reduce(
        (s, b) => s + Number(b.agreed_price) * (PLATFORM_FEE_RATE / (1 + PLATFORM_FEE_RATE)), 0
      );
      setGmv(gmvVal);
      setPlatformRevenue(revVal);
      setAvgBooking(revenueBookings?.length ? gmvVal / revenueBookings.length : 0);

      // Escrow (always current, no period filter)
      const { data: escrowBookings } = await supabase
        .from('bookings')
        .select('agreed_price')
        .not('funds_held_since', 'is', null)
        .is('funds_released_at', null);
      setEscrow((escrowBookings || []).reduce((s, b) => s + Number(b.agreed_price), 0));

      // Tier 2 — Growth signals (current period)
      const fetchCount = async (table: string, col: string, gte?: string | null, filters?: Record<string, any>) => {
        let q = supabase.from(table as any).select(col, { count: 'exact', head: true });
        if (gte) q = q.gte('created_at', gte);
        if (filters) {
          for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
        }
        const { count } = await q;
        return count || 0;
      };

      const fetchBookingCount = async (gte?: string | null) => {
        let q = supabase.from('bookings').select('*', { count: 'exact', head: true })
          .in('booking_status', ['confirmed', 'completed', 'disputed']);
        if (gte) q = q.gte('created_at', gte);
        const { count } = await q;
        return count || 0;
      };

      setNewOrganisers(await fetchCount('user_roles', '*', start, { role: 'user' }));
      setNewCeremonies(await fetchCount('events', '*', start));
      setNewRequests(await fetchCount('service_requests', '*', start));
      setNewBookings(await fetchBookingCount(start));

      if (period !== 'all' && prevStart && start) {
        // Previous period counts — between prevStart and start
        const fetchPrevCount = async (table: string, col: string, filters?: Record<string, any>) => {
          let q = supabase.from(table as any).select(col, { count: 'exact', head: true })
            .gte('created_at', prevStart).lt('created_at', start);
          if (filters) {
            for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
          }
          const { count } = await q;
          return count || 0;
        };
        const fetchPrevBookingCount = async () => {
          const { count } = await supabase.from('bookings').select('*', { count: 'exact', head: true })
            .in('booking_status', ['confirmed', 'completed', 'disputed'])
            .gte('created_at', prevStart).lt('created_at', start);
          return count || 0;
        };
        setPrevOrganisers(await fetchPrevCount('user_roles', '*', { role: 'user' }));
        setPrevCeremonies(await fetchPrevCount('events', '*'));
        setPrevRequests(await fetchPrevCount('service_requests', '*'));
        setPrevBookings(await fetchPrevBookingCount());
      } else {
        setPrevOrganisers(0); setPrevCeremonies(0); setPrevRequests(0); setPrevBookings(0);
      }

      // Tier 3 — Funnel (always all-time)
      const { count: regCount } = await supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'user');
      setFunnelRegistered(regCount || 0);

      const { count: evtCount } = await supabase.from('events').select('*', { count: 'exact', head: true });
      setFunnelCreated(evtCount || 0);

      const { data: srUsers } = await supabase.from('service_requests').select('requester_user_id');
      setFunnelRequested(new Set((srUsers || []).map(r => r.requester_user_id)).size);

      const { data: bkClients } = await supabase.from('bookings').select('client_id')
        .in('booking_status', ['confirmed', 'completed', 'disputed']);
      setFunnelBooked(new Set((bkClients || []).map(b => b.client_id)).size);

      // Tier 4 — Distribution
      const { data: events } = await supabase.from('events').select('type');
      const ebt: Record<string, number> = {};
      (events || []).forEach(e => { ebt[e.type] = (ebt[e.type] || 0) + 1; });
      setEventsByType(ebt);
      setTotalEvents(events?.length || 0);

      const { data: vendors } = await supabase.from('vendors').select('category').eq('is_active', true);
      const vbc: Record<string, number> = {};
      (vendors || []).forEach(v => { vbc[v.category] = (vbc[v.category] || 0) + 1; });
      setVendorsByCategory(vbc);

      setIsLoading(false);
    };
    fetchAll();
  }, [period]);

  const funnelSteps = [
    { label: 'Registered', count: funnelRegistered },
    { label: 'Created a ceremony', count: funnelCreated },
    { label: 'Sent a request', count: funnelRequested },
    { label: 'Confirmed a booking', count: funnelBooked },
  ];
  const funnelMax = funnelSteps[0]?.count || 1;
  const funnelOpacities = [1, 0.75, 0.5, 0.3];

  const periodButtons: { label: string; value: Period }[] = [
    { label: 'This week', value: 'week' },
    { label: 'This month', value: 'month' },
    { label: 'All time', value: 'all' },
  ];

  const growthCards = [
    { label: 'New organisers', current: newOrganisers, prev: prevOrganisers },
    { label: 'New ceremonies', current: newCeremonies, prev: prevCeremonies },
    { label: 'Requests sent', current: newRequests, prev: prevRequests },
    { label: 'Bookings confirmed', current: newBookings, prev: prevBookings },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header with period selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Platform metrics at a glance</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {periodButtons.map(pb => (
            <Button
              key={pb.value}
              variant={period === pb.value ? 'default' : 'ghost'}
              size="sm"
              className="text-xs h-7"
              onClick={() => setPeriod(pb.value)}
            >
              {pb.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tier 1 — Revenue strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Gross bookings value', value: formatRand(gmv) },
          { label: 'Platform revenue earned', value: formatRand(platformRevenue) },
          { label: 'Funds in escrow', value: formatRand(escrow) },
          { label: 'Avg booking value', value: formatRand(avgBooking) },
        ].map(card => (
          <Card key={card.label} className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              {isLoading ? (
                <div className="space-y-2 animate-pulse">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-7 w-20" />
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="text-xl font-bold mt-1">{card.value}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tier 2 — Growth signals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {growthCards.map(gc => (
          <Card key={gc.label}>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="space-y-2 animate-pulse">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-7 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">{gc.label}</p>
                  <p className="text-2xl font-bold mt-1">{gc.current}</p>
                  {period !== 'all' && (
                    <p className="text-xs text-muted-foreground mt-1">prev. period: {gc.prev}</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SMS balance monitor */}
      <SmsBalanceCard />

      {/* Tier 3 — Conversion funnel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Organiser journey</CardTitle>
          <CardDescription>All-time conversion funnel</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {funnelSteps.map((step, i) => {
                const pct = i === 0 ? 100 : funnelSteps[i - 1].count > 0
                  ? Math.round((step.count / funnelSteps[i - 1].count) * 100) : 0;
                const barWidth = funnelMax > 0 ? (step.count / funnelMax) * 100 : 0;
                return (
                  <div key={step.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{step.label}</span>
                      <span className="text-muted-foreground">
                        {step.count}{i > 0 && ` (${pct}%)`}
                      </span>
                    </div>
                    <div className="w-full h-6 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full bg-primary rounded transition-all"
                        style={{
                          width: `${Math.max(barWidth, 2)}%`,
                          opacity: funnelOpacities[i],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tier 4 — Distribution charts (preserved) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Ceremonies by Type
            </CardTitle>
            <CardDescription>Distribution of ceremony types</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-2 w-24" />
                  </div>
                ))}
              </div>
            ) : Object.keys(eventsByType).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No ceremonies created yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(eventsByType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm">{eventTypeLabels[type] || type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${totalEvents > 0 ? (count / totalEvents) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="h-5 w-5" />
              Vendors by Category
            </CardTitle>
            <CardDescription>Distribution of service providers</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-6" />
                  </div>
                ))}
              </div>
            ) : Object.keys(vendorsByCategory).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No vendors registered yet</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(vendorsByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, count]) => (
                    <div key={category} className="flex justify-between items-center py-1">
                      <span className="text-sm">{categoryLabels[category] || category}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
