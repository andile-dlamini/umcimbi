import { useNavigate } from 'react-router-dom';
import { User, Globe, Bell, Info, LogOut, Store, Shield, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { useMyServiceRequests } from '@/hooks/useServiceRequests';

export default function Profile() {
  const navigate = useNavigate();
  const { profile, user, signOut, isVendor, isAdmin } = useAuth();
  const { requests } = useMyServiceRequests();

  const pendingQuotes = requests.filter(r => r.status === 'quoted').length;

  const handleLogout = async () => {
    await signOut();
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen pb-safe">
      <PageHeader title="Profile" showBack />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* User Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {profile?.full_name || 'User'}
                </h2>
                {user?.email && (
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                )}
                {profile?.phone_number && (
                  <p className="text-sm text-muted-foreground">{profile.phone_number}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5" />
              My Quote Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => navigate('/profile/requests')}
            >
              <span>View my requests</span>
              {pendingQuotes > 0 && (
                <Badge variant="destructive">{pendingQuotes} quotes received</Badge>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Vendor Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="h-5 w-5" />
              Vendor Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isVendor ? (
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/profile/vendor')}
                >
                  Manage vendor profile
                </Button>
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => navigate('/vendor-dashboard')}
                >
                  Vendor Dashboard
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Do you offer services for traditional ceremonies? Join our vendor marketplace.
                </p>
                <Button 
                  className="w-full"
                  onClick={() => navigate('/vendors/onboarding')}
                >
                  <Store className="h-4 w-4 mr-2" />
                  I offer services (become a vendor)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Link */}
        {isAdmin && (
          <Card>
            <CardContent className="p-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/admin')}
              >
                <Shield className="h-4 w-4 mr-2" />
                Admin Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label className="font-medium">Language</Label>
                  <p className="text-xs text-muted-foreground">English</p>
                </div>
              </div>
              <Button variant="outline" size="sm" disabled>
                Change
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label className="font-medium">Notifications</Label>
                  <p className="text-xs text-muted-foreground">Reminders & updates</p>
                </div>
              </div>
              <Switch disabled />
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-5 w-5" />
              About Isiko Planner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Isiko Planner helps South African families plan traditional Zulu ceremonies 
              with respect and care. We provide checklists, budget tools, and connect you 
              with trusted vendors to make your special day memorable.
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Version 2.0.0
            </p>
          </CardContent>
        </Card>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log out
        </Button>
      </div>
    </div>
  );
}