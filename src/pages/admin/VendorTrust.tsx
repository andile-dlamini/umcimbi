import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, RefreshCw, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Tier = 'A' | 'B' | 'C' | 'D';

interface BreakdownPart {
  score: number;
  max: number;
  label?: string;
}

interface Breakdown {
  identity?: BreakdownPart;
  responsiveness?: BreakdownPart;
  reviews?: BreakdownPart;
  completed_jobs?: BreakdownPart;
  disputes?: BreakdownPart;
}

interface VendorRow {
  id: string;
  name: string;
  category: string | null;
  location: string | null;
  business_verification_status: string | null;
  trust_score: number | null;
  trust_score_breakdown: Breakdown | null;
  vendor_tier: Tier | null;
  vendor_tier_override: boolean;
  avg_response_time_minutes: number | null;
  trust_score_calculated_at: string | null;
  jobs_completed: number | null;
}

const TIER_BADGE: Record<Tier, string> = {
  A: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
  B: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  C: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  D: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
};

function scoreBarColor(score: number | null): string {
  if (score == null) return 'bg-muted-foreground/40';
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

function pillColor(score: number, max: number): string {
  if (score >= max) return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800';
  if (score > 0) return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
  return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800';
}

function formatMinutes(min: number | null): string {
  if (min == null) return '—';
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatRelative(iso: string | null): string {
  if (!iso) return 'Never';
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return 'Never';
  }
}

const BREAKDOWN_KEYS: Array<{ key: keyof Breakdown; short: string }> = [
  { key: 'identity', short: 'ID' },
  { key: 'responsiveness', short: 'Resp' },
  { key: 'reviews', short: 'Rev' },
  { key: 'completed_jobs', short: 'Jobs' },
  { key: 'disputes', short: 'Disp' },
];

export default function VendorTrust() {
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const fetchVendors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vendors')
      .select(
        'id, name, category, location, business_verification_status, trust_score, trust_score_breakdown, vendor_tier, vendor_tier_override, avg_response_time_minutes, trust_score_calculated_at, jobs_completed'
      )
      .eq('is_active', true)
      .eq('is_demo', false)
      .order('trust_score', { ascending: false, nullsFirst: false });
    if (error) {
      toast.error('Failed to load vendors');
    } else {
      setVendors((data || []) as unknown as VendorRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const recalcAll = async () => {
    setRecalculating(true);
    const { error } = await supabase.rpc('recalculate_all_trust_scores' as never);
    if (error) {
      toast.error('Recalculation failed');
    } else {
      toast.success('All trust scores recalculated');
      await fetchVendors();
    }
    setRecalculating(false);
  };

  const handleTierChange = async (vendor: VendorRow, value: string) => {
    if (value === 'Auto') {
      const { error } = await supabase
        .from('vendors')
        .update({ vendor_tier_override: false })
        .eq('id', vendor.id);
      if (error) {
        toast.error('Failed to update');
        return;
      }
      await supabase.rpc('calculate_vendor_trust_score' as never, { p_vendor_id: vendor.id } as never);
      toast.success(`${vendor.name} set to Auto`);
    } else {
      const { error } = await supabase
        .from('vendors')
        .update({ vendor_tier: value as Tier, vendor_tier_override: true })
        .eq('id', vendor.id);
      if (error) {
        toast.error('Failed to update');
        return;
      }
      toast.success(`${vendor.name} set to Tier ${value}`);
    }
    await fetchVendors();
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    vendors.forEach((v) => v.category && set.add(v.category));
    return Array.from(set).sort();
  }, [vendors]);

  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (tierFilter !== 'all') {
        if (tierFilter === 'Unscored' ? v.vendor_tier != null : v.vendor_tier !== tierFilter) return false;
      }
      if (categoryFilter !== 'all' && v.category !== categoryFilter) return false;
      return true;
    });
  }, [vendors, search, tierFilter, categoryFilter]);

  const summary = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0, D: 0, Unscored: 0 };
    vendors.forEach((v) => {
      if (v.vendor_tier && v.vendor_tier in counts) counts[v.vendor_tier]++;
      else counts.Unscored++;
    });
    return counts;
  }, [vendors]);

  return (
    <div className="min-h-screen pb-safe bg-background">
      <PageHeader title="Vendor Trust" showBack />
      <div className="px-4 py-6 max-w-6xl mx-auto space-y-4">
        {/* Summary */}
        <Card>
          <CardContent className="p-4 flex flex-wrap items-center gap-3">
            {(['A', 'B', 'C', 'D'] as Tier[]).map((t) => (
              <div key={t} className="flex items-center gap-2">
                <Badge variant="outline" className={TIER_BADGE[t]}>Tier {t}</Badge>
                <span className="text-sm font-medium">{summary[t]}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Badge variant="outline">Unscored</Badge>
              <span className="text-sm font-medium">{summary.Unscored}</span>
            </div>
            <div className="ml-auto">
              <Button onClick={recalcAll} disabled={recalculating} size="sm">
                <RefreshCw className={`h-4 w-4 mr-1.5 ${recalculating ? 'animate-spin' : ''}`} />
                Recalculate all scores
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-xs"
            />
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="sm:w-40"><SelectValue placeholder="Tier" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tiers</SelectItem>
                <SelectItem value="A">Tier A</SelectItem>
                <SelectItem value="B">Tier B</SelectItem>
                <SelectItem value="C">Tier C</SelectItem>
                <SelectItem value="D">Tier D</SelectItem>
                <SelectItem value="Unscored">Unscored</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="sm:w-48"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* List */}
        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">No vendors match.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((v) => {
              const breakdown = v.trust_score_breakdown || {};
              const isVerified = v.business_verification_status === 'verified';
              const currentTierValue = v.vendor_tier_override && v.vendor_tier ? v.vendor_tier : 'Auto';
              const scorePct = Math.max(0, Math.min(100, v.trust_score ?? 0));

              return (
                <Card key={v.id}>
                  <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex flex-wrap items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold truncate">{v.name}</h3>
                          {isVerified && (
                            <BadgeCheck className="h-4 w-4 text-blue-500" aria-label="Verified" />
                          )}
                          {v.category && (
                            <Badge variant="secondary" className="text-xs">{v.category}</Badge>
                          )}
                        </div>
                        {v.location && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{v.location}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {v.vendor_tier ? (
                          <Badge variant="outline" className={TIER_BADGE[v.vendor_tier]}>
                            Tier {v.vendor_tier}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground">
                            Unscored
                          </Badge>
                        )}
                        {v.vendor_tier_override && (
                          <Badge variant="outline" className="text-xs">Manual</Badge>
                        )}
                      </div>
                    </div>

                    {/* Score bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Trust score</span>
                        <span className="font-semibold">{v.trust_score ?? 0}/100</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full ${scoreBarColor(v.trust_score)}`}
                          style={{ width: `${scorePct}%` }}
                        />
                      </div>
                    </div>

                    {/* Breakdown pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {BREAKDOWN_KEYS.map(({ key, short }) => {
                        const part = breakdown[key];
                        if (!part) return null;
                        return (
                          <span
                            key={key}
                            className={`text-[11px] px-2 py-0.5 rounded-full border ${pillColor(part.score, part.max)}`}
                            title={part.label}
                          >
                            {short} {part.score}/{part.max}
                          </span>
                        );
                      })}
                    </div>

                    {/* Meta + control */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground pt-1 border-t">
                      <span>Avg response: <span className="text-foreground font-medium">{formatMinutes(v.avg_response_time_minutes)}</span></span>
                      <span>Jobs: <span className="text-foreground font-medium">{v.jobs_completed ?? 0}</span></span>
                      <span>Updated: <span className="text-foreground font-medium">{formatRelative(v.trust_score_calculated_at)}</span></span>
                      <div className="ml-auto flex items-center gap-2">
                        <span>Set tier:</span>
                        <Select
                          value={currentTierValue}
                          onValueChange={(val) => handleTierChange(v, val)}
                        >
                          <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Auto">Auto</SelectItem>
                            <SelectItem value="A">A</SelectItem>
                            <SelectItem value="B">B</SelectItem>
                            <SelectItem value="C">C</SelectItem>
                            <SelectItem value="D">D</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
