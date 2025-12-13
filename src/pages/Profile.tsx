import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Bell, Info, LogOut, Store, Shield, FileText, Receipt, Calendar, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/layout/PageHeader';
import { AvatarUpload } from '@/components/shared/AvatarUpload';
import { useAuth } from '@/context/AuthContext';
import { useMyServiceRequests } from '@/hooks/useServiceRequests';
import { useClientQuotes } from '@/hooks/useQuotes';
import { useClientBookings } from '@/hooks/useBookings';
import { useProfileSettings } from '@/hooks/useProfileSettings';
import { PreferredLanguage } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Profile() {
  const navigate = useNavigate();
  const { profile, user, signOut, isVendor, isAdmin, refreshProfile } = useAuth();
  const { quotes } = useClientQuotes();
  const { bookings } = useClientBookings();
  const { settings, isLoading: settingsLoading, updateNotifications, updateLanguage } = useProfileSettings();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    full_name: '',
    phone_number: '',
  });

  const pendingQuotes = quotes.filter(q => q.status === 'pending_client').length;
  const activeBookings = bookings.filter(b => b.booking_status === 'pending_deposit' || b.booking_status === 'confirmed').length;

  const startEditing = () => {
    setEditData({
      full_name: profile?.full_name || '',
      phone_number: profile?.phone_number || '',
    });
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editData.full_name || null,
        phone_number: editData.phone_number || null,
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated');
      setIsEditing(false);
      refreshProfile?.();
    }
    setIsSaving(false);
  };

  const handleAvatarChange = async (url: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: url })
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error saving avatar:', error);
      toast.error('Failed to save avatar');
    } else {
      refreshProfile?.();
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/onboarding');
  };

  const handleNotificationToggle = async (checked: boolean) => {
    await updateNotifications(checked);
  };

  const handleLanguageChange = async (value: string) => {
    await updateLanguage(value as PreferredLanguage);
  };

  return (
    <div className="min-h-screen pb-safe">
      <PageHeader title="Profile" showBack />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* User Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <AvatarUpload
                  avatarUrl={(profile as any)?.avatar_url || null}
                  onAvatarChange={handleAvatarChange}
                  size="lg"
                />
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={editData.full_name}
                      onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                      placeholder="Full name"
                      className="h-8"
                    />
                    <Input
                      value={editData.phone_number}
                      onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })}
                      placeholder="Phone number"
                      className="h-8"
                    />
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                ) : (
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
                )}
              </div>
              {isEditing ? (
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                    <X className="h-4 w-4" />
                  </Button>
                  <Button size="icon" onClick={handleSaveProfile} disabled={isSaving}>
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button size="icon" variant="ghost" onClick={startEditing}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* My Bookings & Quotes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              My Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => navigate('/profile/requests')}
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                My Bookings
              </span>
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
                  <p className="text-xs text-muted-foreground">
                    {settings.preferred_language === 'zulu' ? 'isiZulu' : 'English'}
                  </p>
                </div>
              </div>
              <Select
                value={settings.preferred_language}
                onValueChange={handleLanguageChange}
                disabled={settingsLoading}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="zulu">isiZulu</SelectItem>
                </SelectContent>
              </Select>
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
              <Switch 
                checked={settings.notifications_enabled}
                onCheckedChange={handleNotificationToggle}
                disabled={settingsLoading}
              />
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
