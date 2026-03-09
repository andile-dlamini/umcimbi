import { PageHeader } from '@/components/layout/PageHeader';
import { useClientBookings } from '@/hooks/useBookings';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Banknote, Clock, Star, FileText, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { BookingWithDetails } from '@/types/booking';
import { bookingStatusConfig } from '@/lib/statusConfig';
import { viewOrderPdfAction } from '@/lib/quoteActions';
import { useStartConversation } from '@/hooks/useChat';
import { toast } from 'sonner';
import { useState } from 'react';

const statusConfig = bookingStatusConfig;

function BookingCard({ booking, onClick }: { booking: BookingWithDetails; onClick: () => void }) {
  const navigate = useNavigate();
  const { startConversation } = useStartConversation();
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const status = statusConfig[booking.booking_status];

  const handleOpenChat = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!booking.vendor?.id) return;
    const convId = await startConversation(booking.vendor.id);
    if (convId) {
      navigate(`/chat/${convId}`);
    } else {
      toast.error('Could not open chat');
    }
  };

  const handleViewPdf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoadingPdf(true);
    await viewOrderPdfAction(booking.id);
    setIsLoadingPdf(false);
  };

  return (
    <Card>
      <CardContent className="p-4 cursor-pointer" onClick={onClick}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            {booking.vendor?.image_urls?.[0] && (
              <img
                src={booking.vendor.image_urls[0]}
                alt={booking.vendor.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            )}
            <div>
              <h3 className="font-semibold text-foreground">{booking.vendor?.name}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{booking.vendor?.rating ? Number(booking.vendor.rating).toFixed(1) : 'New'}</span>
              </div>
            </div>
          </div>
          <Badge className={status.className}>{status.label}</Badge>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{booking.event?.name}</span>
          </div>
          {booking.event_date_time && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{format(new Date(booking.event_date_time), 'PPp')}</span>
            </div>
          )}
          {booking.event?.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{booking.event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Banknote className="h-5 w-5" />
            <span>R{booking.agreed_price.toLocaleString()}</span>
          </div>
        </div>

        {booking.booking_status === 'pending_deposit' && (
          <div className="mt-3 p-2 bg-warning/10 rounded-md">
            <p className="text-xs text-warning font-medium">
              Deposit of R{booking.deposit_amount.toLocaleString()} due
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={handleOpenChat}>
          <MessageCircle className="h-4 w-4 mr-2" />
          Open Chat
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={isLoadingPdf}
          onClick={handleViewPdf}
        >
          <FileText className="h-4 w-4 mr-2" />
          {isLoadingPdf ? 'Loading...' : 'Order PDF'}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function ClientBookings() {
  const { bookings, isLoading } = useClientBookings();
  const navigate = useNavigate();

  const activeOrders = bookings.filter(b =>
    b.booking_status === 'pending_deposit' || b.booking_status === 'confirmed'
  );
  const completedOrders = bookings.filter(b => b.booking_status === 'completed');
  const otherOrders = bookings.filter(b =>
    b.booking_status === 'cancelled' || b.booking_status === 'disputed'
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title="Orders" showBack />
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
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
              <p className="text-muted-foreground">No orders yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Accept a quotation from a vendor to create your first order
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">
                Active ({activeOrders.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedOrders.length})
              </TabsTrigger>
              <TabsTrigger value="other">
                Other ({otherOrders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-4 space-y-3">
              {activeOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No active orders</p>
              ) : (
                activeOrders.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onClick={() => navigate(`/bookings/${booking.id}`)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-4 space-y-3">
              {completedOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No completed orders</p>
              ) : (
                completedOrders.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onClick={() => navigate(`/bookings/${booking.id}`)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="other" className="mt-4 space-y-3">
              {otherOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No cancelled or disputed orders</p>
              ) : (
                otherOrders.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onClick={() => navigate(`/bookings/${booking.id}`)}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
