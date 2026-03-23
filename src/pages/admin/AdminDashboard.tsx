import { useState, useEffect } from 'react';
import { Users, Store, Calendar, BarChart3, TrendingUp, Clock, FileText, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  totalUsers: number;
  totalVendors: number;
  totalEvents: number;
  totalBookings: number;
  totalRequests: number;
  pendingRequests: number;
  waitlistTotal: number;
  waitlistOrganisers: number;
  waitlistVendors: number;
  eventsByType: Record<string, number>;
  vendorsByCategory: Record<string, number>;
}

const kpiCards = [
  { key: 'totalUsers' as const, label: 'Total Users', icon: Users, color: 'text-primary', tooltip: 'All registered accounts — includes both ceremony organisers and vendors.' },
  { key: 'totalVendors' as const, label: 'Active Vendors', icon: Store, color: 'text-secondary', tooltip: 'Vendors with an active listing currently visible to organisers.' },
  { key: 'totalEvents' as const, label: 'Ceremonies', icon: Calendar, color: 'text-accent-foreground', tooltip: 'Total ceremonies created by organisers (all types, any status).' },
  { key: 'totalBookings' as const, label: 'Bookings', icon: FileText, color: 'text-primary', tooltip: 'Confirmed vendor bookings across all ceremonies (any payment status).' },
  { key: 'totalRequests' as const, label: 'Service Requests', icon: TrendingUp, color: 'text-secondary', tooltip: 'Quote requests sent by organisers to vendors (all statuses).' },
  { key: 'pendingRequests' as const, label: 'Pending Requests', icon: Clock, color: 'text-destructive', tooltip: 'Requests still awaiting a vendor response — may need attention.' },
];

const categoryLabels: Record<string, string> = {
  decor: 'Decor',
  catering: 'Catering',
  livestock: 'Livestock',
  tents: 'Tents',
  transport: 'Transport',
  attire: 'Attire',
  photographer: 'Photography',
  invitations_stationery: 'Invitations',
  makeup_beauty: 'Makeup & Beauty',
  cold_room_hire: 'Cold Room Hire',
  mobile_toilets: 'Mobile Toilets',
  attire_tailoring: 'Attire Tailoring',
  drinks_ice_delivery: 'Drinks & Ice',
  cakes_baking: 'Cakes & Baking',
  other: 'Other',
};

const eventTypeLabels: Record<string, string> = {
  umembeso: 'Umembeso',
  umabo: 'Umabo',
  imbeleko: 'Imbeleko',
  family_introduction: 'Family Introduction',
  lobola: 'Lobola',
  umbondo: 'Umbondo',
  umemulo: 'Umemulo',
  funeral: 'Funeral',
  ancestral_ritual: 'Ancestral Ritual',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalVendors: 0,
    totalEvents: 0,
    totalBookings: 0,
    totalRequests: 0,
    pendingRequests: 0,
    waitlistTotal: 0,
    waitlistOrganisers: 0,
    waitlistVendors: 0,
    eventsByType: {},
    vendorsByCategory: {},
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [
        { count: usersCount },
        { count: vendorsCount },
        { count: eventsCount },
        { count: bookingsCount },
        { count: requestsCount },
        { count: pendingCount },
        { data: events },
        { data: vendors },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('service_requests').select('*', { count: 'exact', head: true }),
        supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('events').select('type'),
        supabase.from('vendors').select('category').eq('is_active', true),
      ]);

      // Waitlist stats
      const { count: waitlistCount } = await supabase.from('waitlist_signups' as any).select('*', { count: 'exact', head: true });
      const { data: waitlistData } = await supabase.from('waitlist_signups' as any).select('role');
      const waitlistOrganisers = waitlistData?.filter((w: any) => w.role === 'organiser').length || 0;
      const waitlistVendors = waitlistData?.filter((w: any) => w.role === 'vendor').length || 0;

      const eventsByType: Record<string, number> = {};
      events?.forEach(e => {
        eventsByType[e.type] = (eventsByType[e.type] || 0) + 1;
      });

      const vendorsByCategory: Record<string, number> = {};
      vendors?.forEach(v => {
        vendorsByCategory[v.category] = (vendorsByCategory[v.category] || 0) + 1;
      });

      setStats({
        totalUsers: usersCount || 0,
        totalVendors: vendorsCount || 0,
        totalEvents: eventsCount || 0,
        totalBookings: bookingsCount || 0,
        totalRequests: requestsCount || 0,
        pendingRequests: pendingCount || 0,
        waitlistTotal: waitlistCount || 0,
        waitlistOrganisers,
        waitlistVendors,
        eventsByType,
        vendorsByCategory,
      });
      setIsLoading(false);
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform metrics at a glance</p>
      </div>

      {/* KPI Cards */}
      <TooltipProvider delayDuration={200}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {kpiCards.map((kpi) => (
            <Card key={kpi.key}>
              <CardContent className="p-4 text-center relative">
                {isLoading ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-6 w-6 mx-auto rounded bg-muted" />
                    <div className="h-7 w-10 mx-auto rounded bg-muted" />
                    <div className="h-3 w-16 mx-auto rounded bg-muted" />
                  </div>
                ) : (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px] text-xs">
                        {kpi.tooltip}
                      </TooltipContent>
                    </Tooltip>
                    <kpi.icon className={`h-6 w-6 mx-auto mb-2 ${kpi.color}`} />
                    <p className="text-2xl font-bold">{stats[kpi.key]}</p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </TooltipProvider>

      {/* Waitlist Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Waitlist Signups
          </CardTitle>
          <CardDescription>Pre-launch interest</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-7 w-10 rounded bg-muted" />
              <div className="h-4 w-20 rounded bg-muted" />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-3xl font-bold">{stats.waitlistTotal}</p>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>Organisers: {stats.waitlistOrganisers}</span>
                <span>Vendors: {stats.waitlistVendors}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Events by Type */}
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
                    <div className="h-4 w-20 rounded bg-muted" />
                    <div className="h-2 w-24 rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : Object.keys(stats.eventsByType).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No ceremonies created yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats.eventsByType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm">{eventTypeLabels[type] || type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${stats.totalEvents > 0 ? (count / stats.totalEvents) * 100 : 0}%`,
                            }}
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

        {/* Vendors by Category */}
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
                    <div className="h-4 w-20 rounded bg-muted" />
                    <div className="h-4 w-6 rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : Object.keys(stats.vendorsByCategory).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No vendors registered yet</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(stats.vendorsByCategory)
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
