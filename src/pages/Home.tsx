import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Gift, Heart, Handshake, Sparkles, Store, FileText, Eye, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { useEvents } from '@/hooks/useEvents';
import { useVendorServiceRequests } from '@/hooks/useServiceRequests';
import { EventCard } from '@/components/shared/EventCard';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { EventType } from '@/types/database';

const quickStartOptions: { type: EventType; label: string; description: string; icon: React.ComponentType<{ className?: string }>; colorClass: string }[] = [
  { type: 'umembeso', label: 'Umembeso', description: 'Gift-giving ceremony', icon: Gift, colorClass: 'bg-accent/20 text-accent' },
  { type: 'umabo', label: 'Umabo', description: 'Traditional wedding', icon: Heart, colorClass: 'bg-accent/20 text-accent' },
  { type: 'lobola', label: 'Lobola', description: 'Bridewealth negotiation', icon: Handshake, colorClass: 'bg-accent/20 text-accent' },
  { type: 'umemulo', label: 'Umemulo', description: 'Coming-of-age', icon: Sparkles, colorClass: 'bg-accent/20 text-accent' },
];

export default function Home() {
  const navigate = useNavigate();
  const { profile, vendorProfile, isVendor } = useAuth();
  const { activeRole, canSwitchRole } = useRole();
  const { events, isLoading } = useEvents();
  const { requests, pendingCount } = useVendorServiceRequests();

  const upcomingEvents = [...events].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  // Vendor Dashboard View
  if (activeRole === 'vendor' && isVendor) {
    return (
      <div className="min-h-screen pb-safe">
        {/* Header */}
        <div className="bg-secondary text-secondary-foreground px-4 pt-8 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">
                {vendorProfile?.name || 'Vendor Dashboard'}
              </h1>
              <p className="text-secondary-foreground/80 mt-1">
                Manage your vendor business
              </p>
            </div>
            {canSwitchRole && <RoleSwitcher />}
          </div>
        </div>

        <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{vendorProfile?.view_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Profile views</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{vendorProfile?.added_to_events_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Bookings</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Requests */}
          <Card 
            className={pendingCount > 0 ? 'border-accent cursor-pointer hover:shadow-md transition-shadow' : 'cursor-pointer hover:shadow-md transition-shadow'}
            onClick={() => navigate('/vendor-dashboard')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${pendingCount > 0 ? 'bg-accent/20' : 'bg-muted'}`}>
                    <Clock className={`h-5 w-5 ${pendingCount > 0 ? 'text-accent' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="font-semibold">New requests</p>
                    <p className="text-sm text-muted-foreground">
                      {pendingCount === 0 ? 'No pending requests' : `${pendingCount} awaiting response`}
                    </p>
                  </div>
                </div>
                {pendingCount > 0 && (
                  <Badge variant="destructive">{pendingCount}</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => navigate('/vendor-dashboard')}
            >
              <FileText className="h-5 w-5" />
              <span className="text-sm">All Requests</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => navigate('/profile/vendor')}
            >
              <Store className="h-5 w-5" />
              <span className="text-sm">Edit Profile</span>
            </Button>
          </div>

          {/* Recent Requests */}
          {requests.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-foreground">Recent requests</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate('/vendor-dashboard')}>
                  View all
                </Button>
              </div>
              <div className="space-y-3">
                {requests.slice(0, 3).map((request) => (
                  <Card key={request.id} onClick={() => navigate('/vendor-dashboard')} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{request.event?.name || 'Event'}</p>
                          <p className="text-sm text-muted-foreground">
                            {request.guest_count ? `${request.guest_count} guests` : 'Details pending'}
                          </p>
                        </div>
                        <Badge variant={request.status === 'pending' ? 'secondary' : 'outline'} className="capitalize">
                          {request.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  // Organiser View (default)
  return (
    <div className="min-h-screen pb-safe">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-8 pb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">
            Hi, {profile?.first_name || profile?.full_name?.split(' ')[0] || 'there'}
          </h1>
          {canSwitchRole && <RoleSwitcher />}
        </div>
        <p className="text-primary-foreground/80">
          Let's plan your ceremony
        </p>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        {/* Upcoming Ceremonies */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Upcoming ceremonies
          </h2>

          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : upcomingEvents.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">
                  You have no ceremonies yet
                </p>
                <Button onClick={() => navigate('/events/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Plan a ceremony
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>

        {/* Quick Start */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">
              Quick start
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/events/new')}>
              View all
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {quickStartOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Card 
                  key={option.type}
                  className="cursor-pointer hover:shadow-md transition-shadow tap-highlight-none border-card-border"
                  onClick={() => navigate(`/events/new?type=${option.type}`)}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 ${option.colorClass.split(' ').slice(0, 2).join(' ')}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-foreground text-sm">
                      {option.label}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}