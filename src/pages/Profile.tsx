import { useNavigate } from 'react-router-dom';
import { User, Globe, Bell, Info, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/layout/PageHeader';
import { useApp } from '@/context/AppContext';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useApp();

  const handleLogout = () => {
    logout();
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
                  {user?.name || 'Guest'}
                </h2>
                {user?.phoneNumber && (
                  <p className="text-sm text-muted-foreground">{user.phoneNumber}</p>
                )}
                {user?.isGuest && (
                  <p className="text-xs text-warning">Limited features</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Language */}
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

            {/* Notifications */}
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
              Version 1.0.0
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