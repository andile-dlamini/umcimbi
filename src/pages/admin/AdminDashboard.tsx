import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Store, Users, Sparkles, BadgeCheck, AlertCircle, Calendar, Search } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

type StalledConversation = {
  conversation_id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_phone: string | null;
  planner_name: string | null;
  event_name: string | null;
  event_type: string | null;
  last_message_at: string;
  hours_since_reply: number;
  last_message_preview: string | null;
};

type CeremonyPipelineRow = {
  event_id: string;
  event_name: string;
  event_type: string;
  event_date: string | null;
  requests_sent: number;
  quotes_received: number;
  has_booking: boolean;
};

function truncate(s: string | null | undefined, n = 80) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n).trimEnd() + '…' : s;
}

function getPipelineStatus(row: CeremonyPipelineRow) {
  if (row.has_booking) return { label: 'Booked', className: 'bg-green-100 text-green-800 border-green-200' };
  if (Number(row.requests_sent) === 0) return { label: 'No requests sent', className: 'bg-muted text-muted-foreground border-border' };
  if (Number(row.quotes_received) === 0) return { label: 'Awaiting vendor response', className: 'bg-amber-100 text-amber-800 border-amber-200' };
  return { label: 'Quoted, not booked', className: 'bg-blue-100 text-blue-800 border-blue-200' };
}

function isApproaching(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr).getTime();
  const now = Date.now();
  const in14 = now + 14 * 24 * 60 * 60 * 1000;
  return d >= now - 24 * 60 * 60 * 1000 && d <= in14;
}

export default function AdminDashboard() {
  const [period, setPeriod] = useState<Period>('month');
  const [isLoading, setIsLoading] = useState(true);

  // Revenue data
  const [gmv, setGmv] = useState(0);
  const [platformRevenue, setPlatformRevenue] = useState(0);
  const [escrow, setEscrow] = useState(0);
  const [avgBooking, setAvgBooking] = useState(0);

  // Growth signals
  const [newCeremonies, setNewCeremonies] = useState(0);
  const [prevCeremonies, setPrevCeremonies] = useState(0);
  const [newRequests, setNewRequests] = useState(0);
  const [prevRequests, setPrevRequests] = useState(0);
  const [newBookings, setNewBookings] = useState(0);
  const [prevBookings, setPrevBookings] = useState(0);
  const [pendingQuotes, setPendingQuotes] = useState(0);
  const [requestsAwaitingVendor, setRequestsAwaitingVendor] = useState(0);


  // Stalled conversations
  const [stalledConversations, setStalledConversations] = useState<StalledConversation[]>([]);
  const [stalledCount, setStalledCount] = useState(0);

  // Ceremony pipeline
  const [ceremonyPipeline, setCeremonyPipeline] = useState<CeremonyPipelineRow[]>([]);

  // Funnel (always all-time)
  const [funnelRegistered, setFunnelRegistered] = useState(0);
  const [funnelCreated, setFunnelCreated] = useState(0);
  const [funnelRequested, setFunnelRequested] = useState(0);
  const [funnelBooked, setFunnelBooked] = useState(0);

  // Distribution
  const [vendorsByCategory, setVendorsByCategory] = useState<Record<string, number>>({});

  // Search activity
  const [zeroResultSearches, setZeroResultSearches] = useState<any[]>([]);
  const [topSearchedCategories, setTopSearchedCategories] = useState<Record<string, number>>({});


  // Real account statistics
  const [totalVendors, setTotalVendors] = useState(0);
  const [vendorsJoinedThisMonth, setVendorsJoinedThisMonth] = useState(0);
  const [totalOrganisers, setTotalOrganisers] = useState(0);
  const [organisersJoinedThisMonth, setOrganisersJoinedThisMonth] = useState(0);
  const [pendingVendors, setPendingVendors] = useState(0);

  // AI Daily Brief
  const [dailyBrief, setDailyBrief] = useState<{ brief_text: string; generated_at: string } | null>(null);
  const [briefLoading, setBriefLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('daily_briefs')
        .select('brief_text, generated_at')
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setDailyBrief(data ?? null);
      setBriefLoading(false);
    })();
  }, []);

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

      // Escrow — only money actually received and not yet released
      const { data: escrowBookings } = await supabase
        .from('bookings')
        .select('deposit_amount, deposit_status, balance_amount, balance_status')
        .not('funds_held_since', 'is', null)
        .is('funds_released_at', null);
      setEscrow((escrowBookings || []).reduce((s, b) => {
        const dep = b.deposit_status === 'paid' ? Number(b.deposit_amount || 0) : 0;
        const bal = b.balance_status === 'paid' ? Number(b.balance_amount || 0) : 0;
        return s + dep + bal;
      }, 0));


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

      const { data: registrationStats } = await (supabase as any).rpc('get_admin_user_registration_stats');
      const stats = Array.isArray(registrationStats) ? registrationStats[0] : registrationStats;
      setTotalVendors(Number(stats?.total_vendors || 0));
      setVendorsJoinedThisMonth(Number(stats?.vendors_joined_this_month || 0));
      setTotalOrganisers(Number(stats?.total_organisers || 0));
      setOrganisersJoinedThisMonth(Number(stats?.organisers_joined_this_month || 0));

      const { data: activationStats } = await (supabase as any).rpc('get_admin_activation_stats');
      const act = Array.isArray(activationStats) ? activationStats[0] : activationStats;

      const { count: pendingCount } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true })
        .or('business_verification_status.eq.pending,and(business_verification_status.eq.not_applicable,is_active.eq.false)')
        .or('signup_source.is.null,signup_source.neq.admin_manual')
        .eq('is_demo', false)
        .eq('is_banned', false);
      setPendingVendors(pendingCount || 0);

      setNewCeremonies(await fetchCount('events', '*', start));
      setNewRequests(await fetchCount('service_requests', '*', start));
      setNewBookings(await fetchBookingCount(start));
      setPendingQuotes(Number(act?.quotes_awaiting_client || 0));
      setRequestsAwaitingVendor(Number(act?.requests_awaiting_vendor || 0));

      // Stalled conversations (24-hour threshold)
      const { data: stalled } = await (supabase as any).rpc('get_stalled_conversations', { hours_threshold: 24 });

      setStalledConversations((stalled || []) as StalledConversation[]);
      setStalledCount(stalled?.length || 0);

      // Ceremony pipeline
      const { data: pipeline } = await (supabase as any).rpc('get_ceremony_pipeline');
      setCeremonyPipeline((pipeline || []) as CeremonyPipelineRow[]);

      if (period !== 'all' && prevStart && start) {
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
        setPrevCeremonies(await fetchPrevCount('events', '*'));
        setPrevRequests(await fetchPrevCount('service_requests', '*'));
        setPrevBookings(await fetchPrevBookingCount());
      } else {
        setPrevCeremonies(0); setPrevRequests(0); setPrevBookings(0);
      }


      // Tier 3 — Funnel (always all-time)
      setFunnelRegistered(Number(stats?.total_organisers || 0));


      const { count: evtCount } = await supabase.from('events').select('*', { count: 'exact', head: true });
      setFunnelCreated(evtCount || 0);

      const { data: srUsers } = await supabase.from('service_requests').select('requester_user_id');
      setFunnelRequested(new Set((srUsers || []).map(r => r.requester_user_id)).size);

      const { data: bkClients } = await supabase.from('bookings').select('client_id')
        .in('booking_status', ['confirmed', 'completed', 'disputed']);
      setFunnelBooked(new Set((bkClients || []).map(b => b.client_id)).size);

      // Tier 4 — Vendors by category
      const { data: vendors } = await supabase.from('vendors').select('category').eq('is_active', true);
      const vbc: Record<string, number> = {};
      (vendors || []).forEach(v => { vbc[v.category] = (vbc[v.category] || 0) + 1; });
      setVendorsByCategory(vbc);

      // Search activity
      const { data: zeroResults } = await supabase
        .from('platform_events')
        .select('metadata, created_at')
        .eq('event_type', 'search_zero_results')
        .order('created_at', { ascending: false })
        .limit(20);
      setZeroResultSearches(zeroResults || []);

      const { data: allSearches } = await supabase
        .from('platform_events')
        .select('metadata')
        .in('event_type', ['search_performed', 'search_zero_results']);
      const catCounts: Record<string, number> = {};
      (allSearches || []).forEach((row: any) => {
        const cat = row.metadata?.category;
        if (cat) catCounts[cat] = (catCounts[cat] || 0) + 1;
      });
      setTopSearchedCategories(catCounts);

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
    { label: 'New ceremonies', current: newCeremonies, prev: prevCeremonies, showPrev: true },
    { label: 'Requests sent', current: newRequests, prev: prevRequests, showPrev: true },
    { label: 'Bookings confirmed', current: newBookings, prev: prevBookings, showPrev: true },
    { label: 'Quotes awaiting client', current: pendingQuotes, prev: 0, showPrev: false },
    { label: 'Requests awaiting vendor', current: requestsAwaitingVendor, prev: 0, showPrev: false },

  ];

  const accountCards = [
    { label: 'Total real vendors', value: totalVendors, joined: vendorsJoinedThisMonth, icon: Store },
    { label: 'Total organisers', value: totalOrganisers, joined: organisersJoinedThisMonth, icon: Users },
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

      {/* AI Daily Brief */}
      <Card className="border-l-4 border-l-primary bg-gradient-to-br from-primary/5 to-transparent">
        {briefLoading ? (
          <CardContent className="p-5 space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </CardContent>
        ) : (
          <>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Daily Brief
              </CardTitle>
              {dailyBrief && (
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(dailyBrief.generated_at), { addSuffix: true })}
                </span>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                {dailyBrief?.brief_text ?? 'Your first brief will appear here at 07:00 SAST tomorrow. You will also receive it by email.'}
              </p>
            </CardContent>
          </>
        )}
      </Card>

      {/* Real account statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {accountCards.map(card => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                {isLoading ? (
                  <div className="space-y-2 animate-pulse">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">{card.label}</p>
                      <p className="text-3xl font-bold mt-1">{card.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">Joined this month: {card.joined}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        <Link to="/admin/verification-queue" className="block">
          <Card className={`border-l-4 ${pendingVendors > 0 ? 'border-l-amber-500' : 'border-l-primary'} hover:bg-muted/30 transition-colors h-full`}>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="space-y-2 animate-pulse">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Pending vendors</p>
                    <p className="text-3xl font-bold mt-1">{pendingVendors}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {pendingVendors > 0 ? 'Tap to review approvals' : 'Queue is clear'}
                    </p>
                  </div>
                  <div className={`h-10 w-10 rounded-lg ${pendingVendors > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-primary/10 text-primary'} flex items-center justify-center shrink-0`}>
                    <BadgeCheck className="h-5 w-5" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
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
                  {gc.showPrev && period !== 'all' && (
                    <p className="text-xs text-muted-foreground mt-1">prev. period: {gc.prev}</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Vendors to nudge */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Vendor chats unanswered over 24h
          </CardTitle>
          <CardDescription>Planner sent the last message over 24 hours ago and vendor hasn't replied</CardDescription>

        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : stalledConversations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No vendors are behind on replies right now.</p>
          ) : (
            <div className="divide-y">
              {stalledConversations.map(c => (
                <div key={c.conversation_id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{c.vendor_name}</span>
                        {c.vendor_phone && (
                          <a href={`tel:${c.vendor_phone}`} className="text-xs text-primary hover:underline">
                            {c.vendor_phone}
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Planner: {c.planner_name || '—'}
                        {c.event_name && ` · ${c.event_name}`}
                        {c.event_type && ` (${eventTypeLabels[c.event_type] || c.event_type})`}
                      </p>
                      {c.last_message_preview && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          "{truncate(c.last_message_preview, 80)}"
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 shrink-0">
                      {c.hours_since_reply}h ago
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Ceremony pipeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Ceremony pipeline
          </CardTitle>
          <CardDescription>Every ceremony, its date, and how far it's progressed</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : ceremonyPipeline.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No ceremonies created yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="py-2 pr-3 font-medium">Ceremony</th>
                    <th className="py-2 pr-3 font-medium">Date</th>
                    <th className="py-2 pr-3 font-medium text-right">Requests</th>
                    <th className="py-2 pr-3 font-medium text-right">Quotes</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ceremonyPipeline.map(row => {
                    const status = getPipelineStatus(row);
                    const approaching = isApproaching(row.event_date) && !row.has_booking;
                    return (
                      <tr
                        key={row.event_id}
                        className={`border-b last:border-0 ${approaching ? 'border-l-4 border-l-amber-500 bg-amber-50/30' : ''}`}
                      >
                        <td className="py-2 pr-3">
                          <div className="font-medium">{row.event_name}</div>
                          <div className="text-xs text-muted-foreground">{eventTypeLabels[row.event_type] || row.event_type}</div>
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {row.event_date ? format(new Date(row.event_date), 'd MMM yyyy') : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="py-2 pr-3 text-right">{Number(row.requests_sent)}</td>
                        <td className="py-2 pr-3 text-right">{Number(row.quotes_received)}</td>
                        <td className="py-2">
                          <Badge variant="outline" className={status.className}>{status.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vendors by Category (kept) */}
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

      {/* Search activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search activity
          </CardTitle>
          <CardDescription>What planners are searching for on the vendors page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold mb-2">Searches that found nothing</h4>
            {isLoading ? (
              <div className="space-y-2 animate-pulse">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : zeroResultSearches.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No zero-result searches — good sign.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b">
                      <th className="py-2 pr-3 font-medium">Query</th>
                      <th className="py-2 pr-3 font-medium">Category</th>
                      <th className="py-2 pr-3 font-medium">Location</th>
                      <th className="py-2 font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zeroResultSearches.map((row: any, i: number) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 pr-3">{row.metadata?.query || <span className="text-muted-foreground">—</span>}</td>
                        <td className="py-2 pr-3">{row.metadata?.category ? (categoryLabels[row.metadata.category] || row.metadata.category) : 'Any'}</td>
                        <td className="py-2 pr-3">{row.metadata?.location || 'Any'}</td>
                        <td className="py-2 text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Most searched categories</h4>
            {isLoading ? (
              <div className="space-y-2 animate-pulse">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-4 w-full" />)}
              </div>
            ) : Object.keys(topSearchedCategories).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No searches recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(topSearchedCategories)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, count]) => (
                    <div key={category} className="flex justify-between items-center py-1">
                      <span className="text-sm">{categoryLabels[category] || category}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>

  );
}
