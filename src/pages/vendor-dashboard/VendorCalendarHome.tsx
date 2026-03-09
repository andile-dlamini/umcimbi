import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { useVendorBookings } from '@/hooks/useBookings';
import { BookingWithDetails } from '@/types/booking';
import { format, isSameDay, parseISO, isAfter, startOfToday } from 'date-fns';
import { MessageCircle, Calendar as CalendarIcon, Banknote, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

function getStatusColor(status: string) {
  switch (status) {
    case 'confirmed': return 'bg-primary/20 text-primary';
    case 'pending_deposit': return 'bg-warning/20 text-warning';
    case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    default: return 'bg-muted text-muted-foreground';
  }
}

export default function VendorCalendarHome() {
  const navigate = useNavigate();
  const { profile, vendorProfile } = useAuth();
  const { canSwitchRole } = useRole();
  const { bookings, isLoading } = useVendorBookings();

  const today = startOfToday();

  const upcomingBookings = useMemo(() =>
    bookings
      .filter(b => b.event?.date && isAfter(parseISO(b.event.date), today) && b.booking_status !== 'cancelled')
      .sort((a, b) => new Date(a.event?.date || 0).getTime() - new Date(b.event?.date || 0).getTime()),
    [bookings, today]
  );

  const bookedDates = useMemo(() =>
    bookings
      .filter(b => b.event?.date && b.booking_status !== 'cancelled')
      .map(b => parseISO(b.event!.date!)),
    [bookings]
  );

  const stats = useMemo(() => {
    const active = bookings.filter(b => b.booking_status === 'confirmed').length;
    const pendingDeposit = bookings.filter(b => b.booking_status === 'pending_deposit').length;
    const completed = bookings.filter(b => b.booking_status === 'completed').length;
    return { active, pendingDeposit, completed };
  }, [bookings]);

  return (
    <div className="min-h-screen pb-safe">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent to-accent/80 text-accent-foreground px-4 pt-8 pb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-accent-foreground">
            Hi, {profile?.first_name || profile?.full_name?.split(' ')[0] || 'there'}
          </h1>
          {canSwitchRole && <RoleSwitcher />}
        </div>
        <p className="text-accent-foreground/80">
          {vendorProfile?.name || 'Your vendor dashboard'}
        </p>
      </div>

      <div className="px-4 py-6 space-y-5 max-w-lg mx-auto">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/vendor-dashboard/bookings')}>
            <CardContent className="py-4 px-2">
       <Banknote className="h-5 w-5 mx-auto text-warning mb-1" />
              <p className="text-2xl font-bold text-foreground">{stats.pendingDeposit}</p>
              <p className="text-xs text-muted-foreground">Deposit due</p>
            </CardContent>
          </Card>
          <Card className="text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/vendor-dashboard/bookings')}>
            <CardContent className="py-4 px-2">
              <CalendarIcon className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold text-foreground">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card className="text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/vendor-dashboard/bookings')}>
            <CardContent className="py-4 px-2">
              <Star className="h-5 w-5 mx-auto text-accent mb-1" />
              <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Your schedule</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              className={cn("p-3 pointer-events-auto")}
              modifiers={{ booked: bookedDates }}
              modifiersClassNames={{
                booked: 'bg-primary/20 text-primary font-bold rounded-full',
              }}
              onDayClick={(day) => {
                const match = upcomingBookings.find(b => b.event?.date && isSameDay(parseISO(b.event.date), day));
                if (match) navigate(`/bookings/${match.id}`);
              }}
            />
          </CardContent>
        </Card>

        {/* Upcoming bookings */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground">Upcoming bookings</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/vendor-dashboard/bookings')}>
              View all
            </Button>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground text-center py-6">Loading...</p>
          ) : upcomingBookings.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <CalendarIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4 text-sm">No upcoming bookings</p>
                <Button variant="outline" size="sm" onClick={() => navigate('/chats')}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Check Inbox
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {upcomingBookings.slice(0, 5).map((booking) => (
                <Card
                  key={booking.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/bookings/${booking.id}`)}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {booking.event?.name || 'Unnamed event'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.event?.date ? format(parseISO(booking.event.date), 'EEE, d MMM yyyy') : 'No date'}
                        {booking.event?.location ? ` · ${booking.event.location}` : ''}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn('text-xs shrink-0 ml-2', getStatusColor(booking.booking_status))}>
                      {booking.booking_status === 'pending_deposit' ? 'Deposit due' : booking.booking_status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
