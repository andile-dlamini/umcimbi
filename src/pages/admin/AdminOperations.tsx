import { useState, useEffect } from 'react';
import { ClipboardList, AlertTriangle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function AdminOperations() {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState<DisputedBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDisputes = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, agreed_price, service_category, updated_at, created_at, client_id,
          vendor:vendors(id, name, category),
          event:events(id, name, date)
        `)
        .eq('booking_status', 'disputed')
        .order('updated_at', { ascending: false });

      if (!error && data) {
        setDisputes(data as unknown as DisputedBooking[]);
      }
      setIsLoading(false);
    };
    fetchDisputes();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Operations Queue</h1>
        <p className="text-sm text-muted-foreground mt-1">Pending actions and operational items</p>
      </div>

      {/* Disputed Bookings */}
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
                      {' • '}R{d.agreed_price.toLocaleString()}
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

      {/* Placeholder for future queues */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-5 w-5 text-primary" />
            More Queues Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Vendor verifications, flagged content reviews, and support escalations will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
