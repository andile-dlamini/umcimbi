import { PageHeader } from '@/components/layout/PageHeader';

import { useVendorBookings } from '@/hooks/useBookings';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, BanknoteCheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { BookingWithDetails, BookingStatus } from '@/types/booking';
import { bookingStatusConfig } from '@/lib/statusConfig';

const statusConfig = bookingStatusConfig;

function VendorBookingCard({ 
  booking, 
  onMarkComplete 
}: { 
  booking: BookingWithDetails;
  onMarkComplete?: () => void;
}) {
  const status = statusConfig[booking.booking_status];
  
  return (
    <Card>
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
            <DoBanknotelassName="h-4 w-4" />
            <span>R{booking.agreed_price.toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-3 flex gap-2 text-xs">
          <Badge variant={booking.deposit_status === 'paid' ? 'default' : 'outline'}>
            Deposit: {booking.deposit_status}
          </Badge>
          <Badge variant={booking.balance_status === 'paid' ? 'default' : 'outline'}>
            Balance: {booking.balance_status}
          </Badge>
        </div>

        {booking.booking_status === 'confirmed' && onMarkComplete && (
          <Button 
            className="w-full mt-4" 
            size="sm"
            onClick={onMarkComplete}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark Job Complete
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function VendorBookings() {
  const { bookings, isLoading, markJobCompleted } = useVendorBookings();

  const upcomingBookings = bookings.filter(b => 
    b.booking_status === 'pending_deposit' || b.booking_status === 'confirmed'
  );
  const completedBookings = bookings.filter(b => b.booking_status === 'completed');
  const otherBookings = bookings.filter(b => 
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
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Orders" showBack />
      
      <div className="px-4 py-4 max-w-lg mx-auto">
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No bookings yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Bookings will appear here when clients accept your quotes
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedBookings.length})
              </TabsTrigger>
              <TabsTrigger value="other">
                Other ({otherBookings.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming" className="mt-4 space-y-4">
              {upcomingBookings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No upcoming bookings</p>
              ) : (
                upcomingBookings.map((booking) => (
                  <VendorBookingCard
                    key={booking.id}
                    booking={booking}
                    onMarkComplete={() => markJobCompleted(booking.id)}
                  />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="mt-4 space-y-4">
              {completedBookings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No completed bookings</p>
              ) : (
                completedBookings.map((booking) => (
                  <VendorBookingCard key={booking.id} booking={booking} />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="other" className="mt-4 space-y-4">
              {otherBookings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No cancelled or disputed bookings</p>
              ) : (
                otherBookings.map((booking) => (
                  <VendorBookingCard key={booking.id} booking={booking} />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
      
      
    </div>
  );
}
