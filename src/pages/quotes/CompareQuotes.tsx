import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Star, BadgeCheck, Trophy, Banknote, Shield, Sparkles, 
  MessageCircle, Clock, ChevronRight 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { calculateUmcimbiScores, VendorScoreInput, ScoredVendor } from '@/lib/umcimbiScore';
import { useStartConversation } from '@/hooks/useChat';
import { toast } from 'sonner';
import { QuoteInsight } from '@/components/quotes/QuoteInsight';

interface QuoteRow {
  id: string;
  price: number;
  deposit_percentage: number;
  expires_at: string | null;
  notes: string | null;
  offer_number: string | null;
  status: string;
  vendor: {
    id: string;
    name: string;
    category: string;
    rating: number | null;
    review_count: number | null;
    image_urls: string[] | null;
    business_verification_status: string;
    is_super_vendor: boolean;
    jobs_completed: number;
  };
}

function ScoreBadge({ badge }: { badge: string }) {
  switch (badge) {
    case 'best_value':
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800 gap-1">
          <Trophy className="h-3 w-3" /> Best Value
        </Badge>
      );
    case 'cheapest':
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 gap-1">
          <Banknote className="h-3 w-3" /> Cheapest
        </Badge>
      );
    case 'highest_trust':
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800 gap-1">
          <Shield className="h-3 w-3" /> Highest Trust
        </Badge>
      );
    case 'new':
      return (
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" /> New
        </Badge>
      );
    default:
      return null;
  }
}

function ScoreRing({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? 'text-emerald-500' : score >= 40 ? 'text-amber-500' : 'text-red-400';

  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} fill="none" className="stroke-muted" strokeWidth="4" />
        <circle
          cx="32" cy="32" r={radius} fill="none"
          className={`stroke-current ${color}`}
          strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-foreground">{score}</span>
      </div>
    </div>
  );
}

function CompareCard({ vendor, onOpenChat, ceremonyType }: { vendor: ScoredVendor; onOpenChat: (vendorId: string) => void; ceremonyType: string }) {
  const isExpired = vendor.expiresAt && new Date(vendor.expiresAt) < new Date();

  return (
    <Card className={vendor.badges.includes('best_value') ? 'ring-2 ring-emerald-400/50' : ''}>
      <CardContent className="p-4">
        {/* Header: avatar + name + score */}
        <div className="flex items-start gap-3 mb-3">
          {vendor.vendorImage ? (
            <img src={vendor.vendorImage} alt={vendor.vendorName} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-muted-foreground">{vendor.vendorName[0]}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-foreground truncate">{vendor.vendorName}</h3>
              {vendor.isVerified && <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />}
              {vendor.isSuperVendor && <Star className="h-4 w-4 fill-amber-400 text-amber-400 flex-shrink-0" />}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {vendor.reviewCount < 3 ? 'New' : (vendor.rating ?? 0).toFixed(1)}
              </span>
              <span>·</span>
              <span>{vendor.jobsCompleted} job{vendor.jobsCompleted !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <ScoreRing score={vendor.umcimbiScore} />
        </div>

        {/* Badges */}
        {vendor.badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {vendor.badges.map(b => <ScoreBadge key={b} badge={b} />)}
          </div>
        )}

        {/* Price details */}
        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Quote Price</span>
            <span className="font-bold text-foreground">R{vendor.price.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Deposit ({vendor.depositPercentage}%)</span>
            <span className="text-sm text-foreground">R{Math.round(vendor.price * vendor.depositPercentage / 100).toLocaleString()}</span>
          </div>
          {vendor.expiresAt && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {isExpired ? (
                <span className="text-destructive">Expired</span>
              ) : (
                <span>Expires {formatDistanceToNow(new Date(vendor.expiresAt), { addSuffix: true })}</span>
              )}
            </div>
          )}
        </div>

        {vendor.notes && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{vendor.notes}</p>
        )}

        {ceremonyType && !isExpired && (
          <QuoteInsight
            quoteId={vendor.quoteId}
            price={vendor.price}
            category={vendor.vendorCategory || ''}
            ceremonyType={ceremonyType}
            vendorRating={vendor.rating}
            reviewCount={vendor.reviewCount}
            isVerified={vendor.isVerified}
            jobsCompleted={vendor.jobsCompleted}
            notes={vendor.notes}
          />
        )}

        {/* Umcimbi breakdown */}
        <div className="rounded-lg bg-muted/50 p-3 mb-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Umcimbi Score Breakdown</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Trust</span>
              <div className="h-1.5 bg-muted rounded-full mt-1">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${vendor.trustScore * 100}%` }} />
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Price</span>
              <div className="h-1.5 bg-muted rounded-full mt-1">
                <div className="h-full bg-blue-400 rounded-full" style={{ width: `${vendor.priceScore * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        <Button variant="outline" size="sm" className="w-full" onClick={() => onOpenChat(vendor.quoteId)}>
          <MessageCircle className="h-4 w-4 mr-2" /> Open Chat
        </Button>
      </CardContent>
    </Card>
  );
}

export default function CompareQuotes() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { startConversation } = useStartConversation();

  const eventId = searchParams.get('event_id');
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(eventId);
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<'select' | 'compare'>(eventId ? 'select' : 'select');
  const [ceremonyType, setCeremonyType] = useState('');

  // Fetch user's events that have quotes
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('events')
        .select('id, name')
        .eq('owner_user_id', user.id)
        .order('created_at', { ascending: false });
      setEvents(data || []);
      if (eventId) setSelectedEventId(eventId);
      setIsLoading(false);
    })();
  }, [user, eventId]);

  // Fetch quotes for selected event
  useEffect(() => {
    if (!selectedEventId) { setQuotes([]); return; }
    setIsLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          id, price, deposit_percentage, expires_at, notes, offer_number, status,
          vendor:vendors!quotes_vendor_id_fkey(id, name, category, rating, review_count, image_urls, business_verification_status, is_super_vendor, jobs_completed),
          request:service_requests!quotes_request_id_fkey(event_id)
        `)
        .eq('status', 'pending_client')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching quotes:', error);
        setIsLoading(false);
        return;
      }

      // Filter to quotes belonging to the selected event
      const eventQuotes = (data || []).filter((q: any) => q.request?.event_id === selectedEventId) as unknown as QuoteRow[];
      setQuotes(eventQuotes);
      setIsLoading(false);
    })();
  }, [selectedEventId]);

  const toggleQuote = (id: string) => {
    setSelectedQuoteIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const scoredVendors = useMemo(() => {
    const selected = quotes.filter(q => selectedQuoteIds.has(q.id));
    if (selected.length < 2) return [];

    const inputs: VendorScoreInput[] = selected.map(q => ({
      quoteId: q.id,
      vendorName: q.vendor?.name || 'Unknown',
      vendorImage: q.vendor?.image_urls?.[0] || null,
      vendorCategory: q.vendor?.category,
      rating: q.vendor?.rating ?? null,
      reviewCount: q.vendor?.review_count ?? 0,
      jobsCompleted: q.vendor?.jobs_completed ?? 0,
      isVerified: q.vendor?.business_verification_status === 'verified',
      isSuperVendor: q.vendor?.is_super_vendor ?? false,
      price: q.price,
      depositPercentage: q.deposit_percentage,
      expiresAt: q.expires_at || '',
      notes: q.notes,
      offerNumber: q.offer_number,
      status: q.status,
    }));

    return calculateUmcimbiScores(inputs);
  }, [quotes, selectedQuoteIds]);

  const handleOpenChat = async (quoteId: string) => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote?.vendor?.id) return;
    const convId = await startConversation(quote.vendor.id);
    if (convId) navigate(`/chat/${convId}`);
    else toast.error('Could not open chat');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title="Compare Quotations" showBack />
        <div className="p-4 space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  // Step: select event + quotes
  if (step === 'select' || scoredVendors.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title="Compare Quotations" showBack />
        <div className="p-4 space-y-4">
          {/* Event selector */}
          {!eventId && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Select an event</label>
              <div className="space-y-2">
                {events.map(ev => (
                  <Card
                    key={ev.id}
                    className={`cursor-pointer transition ${selectedEventId === ev.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => { setSelectedEventId(ev.id); setSelectedQuoteIds(new Set()); }}
                  >
                    <CardContent className="p-3 flex items-center justify-between">
                      <span className="font-medium text-foreground">{ev.name}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
                {events.length === 0 && (
                  <p className="text-sm text-muted-foreground">No events found.</p>
                )}
              </div>
            </div>
          )}

          {/* Quote selection */}
          {selectedEventId && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Select quotes to compare (min 2)
              </label>
              {quotes.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No pending quotes for this event.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {quotes.map(q => {
                    const isExpired = q.expires_at && new Date(q.expires_at) < new Date();
                    return (
                      <Card
                        key={q.id}
                        className={`cursor-pointer transition ${selectedQuoteIds.has(q.id) ? 'ring-2 ring-primary' : ''} ${isExpired ? 'opacity-60' : ''}`}
                        onClick={() => !isExpired && toggleQuote(q.id)}
                      >
                        <CardContent className="p-3 flex items-center gap-3">
                          <Checkbox
                            checked={selectedQuoteIds.has(q.id)}
                            disabled={!!isExpired}
                            onCheckedChange={() => !isExpired && toggleQuote(q.id)}
                          />
                          {q.vendor?.image_urls?.[0] ? (
                            <img src={q.vendor.image_urls[0]} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <span className="font-bold text-muted-foreground">{q.vendor?.name?.[0]}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{q.vendor?.name}</p>
                            <p className="text-sm text-muted-foreground">R{q.price.toLocaleString()}</p>
                          </div>
                          {isExpired && <Badge variant="secondary">Expired</Badge>}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {selectedQuoteIds.size >= 2 && (
                <Button className="w-full mt-4" onClick={() => setStep('compare')}>
                  Compare {selectedQuoteIds.size} Quotations
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step: comparison view
  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Compare Quotations" showBack />
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Umcimbi Score</h2>
            <p className="text-xs text-muted-foreground">Higher score = better value for your event</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setStep('select')}>
            Edit Selection
          </Button>
        </div>

        {scoredVendors.map(v => (
          <CompareCard key={v.quoteId} vendor={v} onOpenChat={handleOpenChat} ceremonyType={ceremonyType} />
        ))}
      </div>
    </div>
  );
}
