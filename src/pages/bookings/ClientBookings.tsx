import { PageHeader } from '@/components/layout/PageHeader';

import { useClientBookings } from '@/hooks/useBookings';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, DollarSign, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { BookingWithDetails, BookingStatus } from '@/types/booking';
import { bookingStatusConfig } from '@/lib/statusConfig';

const statusConfig = bookingStatusConfig;

function BookingCard({ booking, onClick }: { booking: BookingWithDetails; onClick: () => void }) {
  const status = statusConfig[booking.booking_status];
  
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-foreground">{booking.vendor?.name}</h3>
            <p className="text-sm text-muted-foreground">{booking.service_category}</p>
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
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
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
    </Card>
  );
}

export default function ClientBookings() {
  const { bookings, isLoading } = useClientBookings();
  const navigate = useNavigate();

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
        <PageHeader title="My Bookings" showBack />
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
      <PageHeader title="My Bookings" showBack />
      
      <div className="p-4">
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No bookings yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Accept a quote from a vendor to create your first booking
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
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onClick={() => navigate(`/bookings/${booking.id}`)}
                  />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="mt-4 space-y-4">
              {completedBookings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No completed bookings</p>
              ) : (
                completedBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onClick={() => navigate(`/bookings/${booking.id}`)}
                  />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="other" className="mt-4 space-y-4">
              {otherBookings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No cancelled or disputed bookings</p>
              ) : (
                otherBookings.map((booking) => (
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
