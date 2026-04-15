import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, subWeeks } from 'date-fns';

const PLATFORM_FEE_RATE = 0.08;

const formatRand = (v: number) =>
  `R ${v.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const statusLabels: Record<string, string> = {
  pending_deposit: 'Pending deposit',
  confirmed: 'Confirmed',
  completed: 'Completed',
  disputed: 'Disputed',
  cancelled: 'Cancelled',
};

const eventTypeLabels: Record<string, string> = {
  lobola: 'Lobola', umembeso: 'Umembeso', umbondo: 'Umbondo', umabo: 'Umabo',
  umemulo: 'Umemulo', imbeleko: 'Imbeleko', ancestral_ritual: 'Ancestral Ritual',
};

const revenueChartConfig = {
  gmv: { label: 'GMV', color: 'hsl(var(--primary))' },
  revenue: { label: 'Platform revenue', color: 'hsl(var(--secondary))' },
};

const ceremonyChartConfig = {
  gmv: { label: 'GMV', color: 'hsl(var(--primary))' },
};

const statusChartConfig = {
  count: { label: 'Bookings', color: 'hsl(var(--muted-foreground))' },
};

export default function AdminRevenue() {
  const [isLoading, setIsLoading] = useState(true);

  // KPIs
  const [gmv, setGmv] = useState(0);
  const [platformRevenue, setPlatformRevenue] = useState(0);
  const [escrow, setEscrow] = useState(0);
  const [avgBooking, setAvgBooking] = useState(0);

  // Charts
  const [weeklyData, setWeeklyData] = useState<{ week: string; gmv: number; revenue: number }[]>([]);
  const [ceremonyData, setCeremonyData] = useState<{ type: string; gmv: number }[]>([]);
  const [statusData, setStatusData] = useState<{ status: string; count: number }[]>([]);

  // Payouts
  const [paidToVendors, setPaidToVendors] = useState(0);
  const [pendingRelease, setPendingRelease] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);

      // All bookings for KPIs and charts
      const { data: allBookings } = await supabase
        .from('bookings')
        .select('id, agreed_price, booking_status, created_at, event_id, funds_held_since, funds_released_at');

      const active = (allBookings || []).filter(b =>
        ['confirmed', 'completed', 'disputed'].includes(b.booking_status)
      );

      const gmvVal = active.reduce((s, b) => s + Number(b.agreed_price), 0);
      const revVal = active.reduce(
        (s, b) => s + Number(b.agreed_price) * (PLATFORM_FEE_RATE / (1 + PLATFORM_FEE_RATE)), 0
      );
      setGmv(gmvVal);
      setPlatformRevenue(revVal);
      setAvgBooking(active.length ? gmvVal / active.length : 0);

      // Escrow
      const escrowVal = (allBookings || [])
        .filter(b => b.funds_held_since && !b.funds_released_at)
        .reduce((s, b) => s + Number(b.agreed_price), 0);
      setEscrow(escrowVal);

      // Weekly chart (8 weeks)
      const eightWeeksAgo = subWeeks(new Date(), 8);
      const recentActive = active.filter(b => new Date(b.created_at) >= eightWeeksAgo);
      const weekMap = new Map<string, { gmv: number; revenue: number }>();
      for (let i = 7; i >= 0; i--) {
        const ws = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
        const key = format(ws, 'dd MMM');
        weekMap.set(key, { gmv: 0, revenue: 0 });
      }
      recentActive.forEach(b => {
        const ws = startOfWeek(new Date(b.created_at), { weekStartsOn: 1 });
        const key = format(ws, 'dd MMM');
        const entry = weekMap.get(key);
        if (entry) {
          const price = Number(b.agreed_price);
          entry.gmv += price;
          entry.revenue += price * (PLATFORM_FEE_RATE / (1 + PLATFORM_FEE_RATE));
        }
      });
      setWeeklyData(Array.from(weekMap.entries()).map(([week, v]) => ({ week, ...v })));

      // GMV by ceremony type — need events
      const eventIds = [...new Set(active.map(b => b.event_id))];
      const { data: events } = await supabase.from('events').select('id, type').in('id', eventIds.length ? eventIds : ['none']);
      const eventTypeMap = new Map((events || []).map(e => [e.id, e.type]));
      const ctMap: Record<string, number> = {};
      active.forEach(b => {
        const t = eventTypeMap.get(b.event_id) || 'unknown';
        ctMap[t] = (ctMap[t] || 0) + Number(b.agreed_price);
      });
      setCeremonyData(
        Object.entries(ctMap)
          .sort((a, b) => b[1] - a[1])
          .map(([type, gmv]) => ({ type: eventTypeLabels[type] || type, gmv }))
      );

      // Bookings by status
      const statusMap: Record<string, number> = {};
      (allBookings || []).forEach(b => {
        statusMap[b.booking_status] = (statusMap[b.booking_status] || 0) + 1;
      });
      setStatusData(
        ['pending_deposit', 'confirmed', 'completed', 'disputed', 'cancelled']
          .map(s => ({ status: statusLabels[s] || s, count: statusMap[s] || 0 }))
      );

      // Payouts
      const paid = (allBookings || [])
        .filter(b => b.booking_status === 'completed' && b.funds_released_at)
        .reduce((s, b) => s + Number(b.agreed_price) / (1 + PLATFORM_FEE_RATE), 0);
      setPaidToVendors(paid);

      // Pending release: proofs uploaded but funds not released
      const { data: proofs } = await supabase.from('delivery_proofs').select('booking_id');
      const proofBookingIds = new Set((proofs || []).map(p => p.booking_id));
      const pendingVal = (allBookings || [])
        .filter(b => proofBookingIds.has(b.id) && !b.funds_released_at && !['completed', 'cancelled'].includes(b.booking_status))
        .reduce((s, b) => s + Number(b.agreed_price), 0);
      setPendingRelease(pendingVal);

      setIsLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Revenue</h1>
        <p className="text-sm text-muted-foreground mt-1">Financial performance overview</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total GMV', value: formatRand(gmv) },
          { label: 'Total platform revenue', value: formatRand(platformRevenue) },
          { label: 'Funds in escrow', value: formatRand(escrow) },
          { label: 'Avg booking value', value: formatRand(avgBooking) },
        ].map(card => (
          <Card key={card.label}>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="space-y-2 animate-pulse">
                  <Skeleton className="h-4 w-28" />
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

      {/* Chart 1 — Revenue over time */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Revenue over time</CardTitle>
          <CardDescription>Last 8 weeks — GMV vs platform revenue</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <ChartContainer config={revenueChartConfig} className="h-[280px]">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(value) => formatRand(Number(value))} />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="gmv" fill="var(--color-gmv)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* GMV by ceremony type */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">GMV by ceremony type</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : ceremonyData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No booking data yet</p>
            ) : (
              <ChartContainer config={ceremonyChartConfig} className="h-[250px]">
                <BarChart data={ceremonyData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="type" width={110} />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value) => formatRand(Number(value))} />}
                  />
                  <Bar dataKey="gmv" fill="var(--color-gmv)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Bookings by status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Bookings by status</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ChartContainer config={statusChartConfig} className="h-[250px]">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payout summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total paid to vendors', value: formatRand(paidToVendors) },
          { label: 'Currently held in escrow', value: formatRand(escrow) },
          { label: 'Pending release', value: formatRand(pendingRelease) },
        ].map(card => (
          <Card key={card.label}>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="space-y-2 animate-pulse">
                  <Skeleton className="h-4 w-28" />
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
    </div>
  );
}
