import { PageHeader } from '@/components/layout/PageHeader';
import { useVendorBookings } from '@/hooks/useBookings';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Banknote, CheckCircle, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { BookingWithDetails } from '@/types/booking';
import { bookingStatusConfig } from '@/lib/statusConfig';

function OrderCard({
  booking,
  onMarkComplete,
}: {
  booking: BookingWithDetails;
  onMarkComplete?: () => void;
}) {
  const navigate = useNavigate();
  const status = bookingStatusConfig[booking.booking_status];

  return (
    <Card className="cursor-pointer" onClick={() => navigate(`/bookings/${booking.id}`)}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-foreground">{booking.event?.name}</h3>
            <p className="text-sm text-muted-foreground">{booking.service_category}</p>
          </div>
          <Badge className={status.className}>{status.label}</Badge>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          {booking.event_date_time && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(booking.event_date_time), 'PPp')}</span>
            </div>
          )}
          {booking.event?.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{booking.event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4" />
            <span>R{booking.agreed_price.toLocaleString()}</span>
          </div>
        </div>

        {booking.booking_status === 'confirmed' && onMarkComplete && (
          <Button
            className="w-full mt-4"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onMarkComplete(); }}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark Job Complete
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function VendorOrders() {
  const { bookings, isLoading, markJobCompleted } = useVendorBookings();

  const activeOrders = bookings.filter(
    b => b.booking_status === 'pending_deposit' || b.booking_status === 'confirmed'
  );
  const completedOrders = bookings.filter(b => b.booking_status === 'completed');
  const otherOrders = bookings.filter(
    b => b.booking_status === 'cancelled' || b.booking_status === 'disputed'
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Orders" showBack />
        <div className="p-4 space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Orders" showBack />

      <div className="px-4 py-4 max-w-lg mx-auto">
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No orders yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Orders will appear here when clients accept your quotations
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Active ({activeOrders.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
              <TabsTrigger value="other">Other ({otherOrders.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-4 space-y-3">
              {activeOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No active orders</p>
              ) : (
                activeOrders.map(b => (
                  <OrderCard key={b.id} booking={b} onMarkComplete={() => markJobCompleted(b.id)} />
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-4 space-y-3">
              {completedOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No completed orders</p>
              ) : (
                completedOrders.map(b => <OrderCard key={b.id} booking={b} />)
              )}
            </TabsContent>

            <TabsContent value="other" className="mt-4 space-y-3">
              {otherOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No cancelled or disputed orders</p>
              ) : (
                otherOrders.map(b => <OrderCard key={b.id} booking={b} />)
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
