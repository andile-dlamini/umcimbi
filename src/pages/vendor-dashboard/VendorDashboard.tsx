import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Eye, Users, MessageCircle, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { useVendorServiceRequests } from '@/hooks/useServiceRequests';
import { ServiceRequestCard } from '@/components/vendors/ServiceRequestCard';
import { format } from 'date-fns';

export default function VendorDashboard() {
  const navigate = useNavigate();
  const { vendorProfile } = useAuth();
  const { requests, isLoading, pendingCount, respondToRequest, declineRequest } = useVendorServiceRequests();
  const [activeTab, setActiveTab] = useState('requests');

  if (!vendorProfile) {
    return (
      <div className="min-h-screen pb-safe">
        <PageHeader title="Vendor Dashboard" showBack />
        <div className="px-4 py-12 text-center">
          <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">No vendor profile</h2>
          <p className="text-muted-foreground mb-6">
            Register as a vendor to access this dashboard
          </p>
          <Button onClick={() => navigate('/vendors/onboarding')}>
            Become a vendor
          </Button>
        </div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const quotedRequests = requests.filter(r => r.status === 'quoted');
  const acceptedRequests = requests.filter(r => r.status === 'accepted');
  const completedRequests = requests.filter(r => r.status === 'completed' || r.status === 'declined');

  return (
    <div className="min-h-screen pb-safe bg-background">
      <PageHeader title="Vendor Dashboard" showBack />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vendorProfile.view_count}</p>
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
                <p className="text-2xl font-bold">{vendorProfile.added_to_events_count}</p>
                <p className="text-xs text-muted-foreground">Event bookings</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          <Card className={pendingCount > 0 ? 'border-accent' : ''}>
            <CardContent className="p-3 text-center">
              <Clock className="h-5 w-5 mx-auto mb-1 text-accent" />
              <p className="text-lg font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <FileText className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{quotedRequests.length}</p>
              <p className="text-xs text-muted-foreground">Quoted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-600" />
              <p className="text-lg font-bold">{acceptedRequests.length}</p>
              <p className="text-xs text-muted-foreground">Accepted</p>
            </CardContent>
          </Card>
        </div>

        {/* Requests Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="requests" className="relative">
              New
              {pendingCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="mt-4 space-y-3">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-6">Loading...</p>
            ) : pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No new requests</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    New quote requests will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingRequests.map((request) => (
                <ServiceRequestCard
                  key={request.id}
                  request={request}
                  onRespond={respondToRequest}
                  onDecline={declineRequest}
                  isVendorView
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-4 space-y-3">
            {[...quotedRequests, ...acceptedRequests].length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No active requests</p>
                </CardContent>
              </Card>
            ) : (
              [...quotedRequests, ...acceptedRequests].map((request) => (
                <ServiceRequestCard
                  key={request.id}
                  request={request}
                  isVendorView
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-3">
            {completedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No request history</p>
                </CardContent>
              </Card>
            ) : (
              completedRequests.map((request) => (
                <ServiceRequestCard
                  key={request.id}
                  request={request}
                  isVendorView
                />
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3 pt-4">
          <Button
            variant="outline"
            className="h-auto py-3"
            onClick={() => navigate('/profile/vendor')}
          >
            <Store className="h-4 w-4 mr-2" />
            Edit profile
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3"
            onClick={() => navigate(`/vendors/${vendorProfile.id}`)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View public page
          </Button>
        </div>
      </div>
    </div>
  );
}