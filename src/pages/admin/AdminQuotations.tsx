import { useEffect, useMemo, useState } from 'react';
import { FileText, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { viewQuotePdfAction } from '@/lib/quoteActions';
import { getVendorCategoryLabel, LIVE_VENDOR_CATEGORY_FILTER_OPTIONS } from '@/lib/vendorCategories';
import { FUNNEL_STAGES, FUNNEL_STAGE_CLASSES, FunnelStage, getQuoteStage } from '@/lib/quoteFunnel';

const eventTypeLabels: Record<string, string> = {
  lobola: 'Lobola',
  umembeso: 'Umembeso',
  umbondo: 'Umbondo',
  umabo: 'Umabo',
  umemulo: 'Umemulo',
  imbeleko: 'Imbeleko',
  ancestral_ritual: 'Ancestral Ritual',
  family_introduction: 'Family Introduction',
};

const formatCurrency = (v: number) =>
  `R ${v.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

interface FunnelRow {
  id: string;
  offerNumber: string | null;
  price: number;
  createdAt: string;
  hasDocument: boolean;
  ceremony: string;
  category: string;
  organiser: string;
  vendorName: string;
  stage: FunnelStage;
}

export default function AdminQuotations() {
  const [rows, setRows] = useState<FunnelRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);

      const { data: quotes } = await supabase
        .from('quotes')
        .select(`
          id, offer_number, price, created_at, status, final_offer_pdf_key,
          vendor:vendors(id, name, category),
          request:service_requests(id, status, requester_user_id, event:events(id, name, type))
        `)
        .order('created_at', { ascending: false });

      const list = (quotes || []) as any[];
      const quoteIds = list.map((q) => q.id);

      const [{ data: bookings }, { data: profiles }] = await Promise.all([
        quoteIds.length
          ? supabase
              .from('bookings')
              .select('quote_id, booking_status, deposit_status')
              .in('quote_id', quoteIds)
          : Promise.resolve({ data: [] as any[] } as any),
        (async () => {
          const userIds = Array.from(
            new Set(list.map((q) => q.request?.requester_user_id).filter(Boolean))
          );
          if (!userIds.length) return { data: [] as any[] } as any;
          return supabase.from('profiles').select('user_id, full_name').in('user_id', userIds);
        })(),
      ]);

      const bookingByQuote = new Map<string, any>();
      (bookings || []).forEach((b: any) => {
        if (b.quote_id) bookingByQuote.set(b.quote_id, b);
      });
      const nameByUser = new Map<string, string>();
      (profiles || []).forEach((p: any) => nameByUser.set(p.user_id, p.full_name || '—'));

      setRows(
        list.map((q) => {
          const booking = bookingByQuote.get(q.id);
          return {
            id: q.id,
            offerNumber: q.offer_number,
            price: Number(q.price) || 0,
            createdAt: q.created_at,
            hasDocument: !!q.final_offer_pdf_key,
            ceremony: q.request?.event?.type
              ? eventTypeLabels[q.request.event.type] || q.request.event.type
              : '—',
            category: q.vendor?.category || 'other',
            organiser: nameByUser.get(q.request?.requester_user_id) || '—',
            vendorName: q.vendor?.name || '—',
            stage: getQuoteStage({
              quoteStatus: q.status,
              requestStatus: q.request?.status,
              bookingStatus: booking?.booking_status,
              depositStatus: booking?.deposit_status,
            }),
          };
        })
      );
      setIsLoading(false);
    };

    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (stageFilter !== 'all' && r.stage !== stageFilter) return false;
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      if (term) {
        const haystack = `${r.vendorName} ${r.organiser} ${r.offerNumber || ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [rows, stageFilter, categoryFilter, search]);

  const stageSummary = useMemo(
    () =>
      FUNNEL_STAGES.map((stage) => {
        const items = filtered.filter((r) => r.stage === stage);
        return {
          stage,
          count: items.length,
          value: items.reduce((sum, r) => sum + r.price, 0),
        };
      }),
    [filtered]
  );

  const grandTotal = useMemo(
    () => ({
      count: filtered.length,
      value: filtered.reduce((sum, r) => sum + r.price, 0),
    }),
    [filtered]
  );

  const categorySummary = useMemo(() => {
    const map = new Map<string, { count: number; value: number }>();
    filtered.forEach((r) => {
      const entry = map.get(r.category) || { count: 0, value: 0 };
      entry.count += 1;
      entry.value += r.price;
      map.set(r.category, entry);
    });
    return Array.from(map.entries())
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Quotations funnel
        </h1>
        <p className="text-sm text-muted-foreground">
          Every quote on the platform, with the stage it has reached.
        </p>
      </div>

      {/* Stage summary */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stageSummary.map((s) => (
          <Card key={s.stage}>
            <CardContent className="pt-6">
              <Badge variant="outline" className={FUNNEL_STAGE_CLASSES[s.stage]}>
                {s.stage}
              </Badge>
              <p className="mt-2 text-2xl font-bold text-foreground">{s.count}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(s.value)}</p>
            </CardContent>
          </Card>
        ))}
        <Card className="border-primary/40">
          <CardContent className="pt-6">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              All quotes
            </Badge>
            <p className="mt-2 text-2xl font-bold text-foreground">{grandTotal.count}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(grandTotal.value)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">By category</CardTitle>
          <CardDescription>Quote volume and value per vendor category.</CardDescription>
        </CardHeader>
        <CardContent>
          {categorySummary.length === 0 ? (
            <p className="text-sm text-muted-foreground">No quotes match the current filters.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {categorySummary.map((c) => (
                <div
                  key={c.category}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {getVendorCategoryLabel(c.category)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.count} quote{c.count === 1 ? '' : 's'}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground shrink-0">
                    {formatCurrency(c.value)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters + table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All quotes</CardTitle>
          <CardDescription>{filtered.length} shown, newest first.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vendor, organiser or reference"
                className="pl-9"
              />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="All stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                {FUNNEL_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="sm:w-56">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                {LIVE_VENDOR_CATEGORY_FILTER_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No quotes match the current filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Ceremony</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Organiser</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.offerNumber || '—'}</TableCell>
                      <TableCell>{r.ceremony}</TableCell>
                      <TableCell>{getVendorCategoryLabel(r.category)}</TableCell>
                      <TableCell>{r.organiser}</TableCell>
                      <TableCell>{r.vendorName}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.price)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={FUNNEL_STAGE_CLASSES[r.stage]}>
                          {r.stage}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {format(new Date(r.createdAt), 'd MMM yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.hasDocument ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewQuotePdfAction(r.id)}
                          >
                            View quote
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
