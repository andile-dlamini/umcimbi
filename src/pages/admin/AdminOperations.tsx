import { useState, useEffect } from 'react';
import { ClipboardList, AlertTriangle, ExternalLink, Clock, BadgeCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface DisputedBooking {
  id: string;
  agreed_price: number;
  service_category: string | null;
  updated_at: string;
  created_at: string;
  client_id: string;
  vendor: { id: string; name: string; category: string } | null;
  event: { id: string; name: string; date: string | null } | null;
}

interface ProofMissing {
  id: string;
  agreed_price: number;
  event_date_time: string;
  vendor: { name: string } | null;
  event: { name: string; date: string | null } | null;
}

interface StuckRelease {
  bookingId: string;
  vendorName: string;
  proofCreatedAt: string;
  hoursOverdue: number;
}

export default function AdminOperations() {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState<DisputedBooking[]>([]);
  const [proofMissing, setProofMissing] = useState<ProofMissing[]>([]);
  const [stuckReleases, setStuckReleases] = useState<StuckRelease[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      // 1. Disputed bookings (existing)
      const { data: disputeData } = await supabase
        .from('bookings')
        .select(`
          id, agreed_price, service_category, updated_at, created_at, client_id,
          vendor:vendors(id, name, category),
          event:events(id, name, date)
        `)
        .eq('booking_status', 'disputed')
        .order('updated_at', { ascending: false });
      if (disputeData) setDisputes(disputeData as unknown as DisputedBooking[]);

      // 2. Proof not uploaded: confirmed bookings past event date by 24h
      const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: confirmedPast } = await supabase
        .from('bookings')
        .select(`id, agreed_price, event_date_time, vendor:vendors(name), event:events(name, date)`)
        .eq('booking_status', 'confirmed')
        .not('event_date_time', 'is', null)
        .lt('event_date_time', cutoff24h);

      const { data: allProofs } = await supabase.from('delivery_proofs').select('booking_id');
      const proofIds = new Set((allProofs || []).map(p => p.booking_id));

      const missing = (confirmedPast || [])
        .filter(b => !proofIds.has(b.id))
        .map(b => ({
          id: b.id,
          agreed_price: Number(b.agreed_price),
          event_date_time: b.event_date_time!,
          vendor: b.vendor as any,
          event: b.event as any,
        }));
      setProofMissing(missing);

      // 3. Stuck escrow releases: proofs older than 50h where funds not released
      const cutoff50h = new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString();
      const { data: oldProofs } = await supabase
        .from('delivery_proofs')
        .select('booking_id, created_at')
        .lt('created_at', cutoff50h);

      if (oldProofs && oldProofs.length > 0) {
        const proofBookingIds = oldProofs.map(p => p.booking_id);
        const { data: stuckBookings } = await supabase
          .from('bookings')
          .select('id, vendor:vendors(name)')
          .in('id', proofBookingIds)
          .is('funds_released_at', null)
          .not('booking_status', 'in', '("completed","cancelled")');

        const stuckSet = new Map((stuckBookings || []).map(b => [b.id, (b.vendor as any)?.name || 'Unknown']));
        const stuck: StuckRelease[] = [];
        oldProofs.forEach(p => {
          if (stuckSet.has(p.booking_id)) {
            const hours = Math.floor((Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60)) - 48;
            stuck.push({
              bookingId: p.booking_id,
              vendorName: stuckSet.get(p.booking_id)!,
              proofCreatedAt: p.created_at,
              hoursOverdue: Math.max(hours, 0),
            });
          }
        });
        setStuckReleases(stuck);
      }

      // 4. Pending verifications
      const { count } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true })
        .eq('business_verification_status', 'pending');
      setPendingVerifications(count || 0);

      setIsLoading(false);
    };
    fetchAll();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Operations Queue</h1>
        <p className="text-sm text-muted-foreground mt-1">Pending actions and operational items</p>
      </div>

      {/* Queue 1 — Disputed Bookings (preserved) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Disputed Bookings
            {disputes.length > 0 && (
              <Badge variant="destructive" className="ml-2">{disputes.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : disputes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No disputed bookings. All clear! ✅</p>
          ) : (
            <div className="space-y-3">
              {disputes.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">
                      {d.vendor?.name || 'Unknown Vendor'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {d.event?.name || 'Unknown Event'}
                      {d.service_category && ` • ${d.service_category}`}
                      {' • '}R{Number(d.agreed_price).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Reported {format(new Date(d.updated_at), 'dd MMM yyyy, HH:mm')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/bookings/${d.id}`)}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Queue 2 — Proof not uploaded */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Proof not uploaded
            {proofMissing.length > 0 && (
              <Badge className="ml-2 bg-amber-500 text-white">{proofMissing.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : proofMissing.length === 0 ? (
            <p className="text-sm text-muted-foreground">No outstanding proofs ✅</p>
          ) : (
            <div className="space-y-3">
              {proofMissing.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">
                      {(b.vendor as any)?.name || 'Unknown Vendor'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(b.event as any)?.name || 'Unknown Event'}
                      {(b.event as any)?.date && ` • ${format(new Date((b.event as any).date), 'dd MMM yyyy')}`}
                      {' • '}R{b.agreed_price.toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/bookings/${b.id}`)}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    View booking
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Queue 3 — Stuck releases */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-5 w-5 text-destructive" />
            Stuck releases
            {stuckReleases.length > 0 && (
              <Badge variant="destructive" className="ml-2">{stuckReleases.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>Proof uploaded but funds not released after 50 hours — possible payout system issue.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
            </div>
          ) : stuckReleases.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stuck releases ✅</p>
          ) : (
            <div className="space-y-3">
              {stuckReleases.map((s) => (
                <div
                  key={s.bookingId}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">
                      {s.bookingId.slice(0, 8)}… — {s.vendorName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Proof uploaded: {format(new Date(s.proofCreatedAt), 'dd MMM yyyy, HH:mm')}
                    </p>
                    <p className="text-xs text-destructive font-medium mt-0.5">
                      {s.hoursOverdue}h overdue
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/bookings/${s.bookingId}`)}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    View booking
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Queue 4 — Pending verifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BadgeCheck className="h-5 w-5 text-primary" />
            Vendor verifications pending
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : pendingVerifications === 0 ? (
            <p className="text-sm text-muted-foreground">No pending verifications ✅</p>
          ) : (
            <div className="space-y-3">
              <p className="text-3xl font-bold">{pendingVerifications}</p>
              <Button variant="outline" onClick={() => navigate('/admin/verification-queue')}>
                Review queue →
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
