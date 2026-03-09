import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Bell, Info, LogOut, Store, Shield, FileText, Receipt, Calendar, Edit2, Save, X, LayoutDashboard, ArrowRight, KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react';
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
import { useRole } from '@/context/RoleContext';
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
  const { activeRole, setActiveRole, canSwitchRole } = useRole();
  const { quotes } = useClientQuotes();
  const { bookings } = useClientBookings();
  const { settings, isLoading: settingsLoading, updateNotifications, updateLanguage } = useProfileSettings();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    full_name: '',
    phone_number: '',
  });

  // Change password state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      // Re-authenticate with current password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        toast.error('Current password is incorrect');
        setIsChangingPassword(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordSection(false);
      }
    } catch (err) {
      toast.error('Failed to change password');
    }
    setIsChangingPassword(false);
  };

  const handleLanguageChange = async (value: string) => {
    await updateLanguage(value as PreferredLanguage);
  };

  return (
    <div className="min-h-screen pb-safe">
      <PageHeader title="Profile" showBack />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* User Info */}
        <Card className="border-card-border">
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
        <Card className="border-card-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              My Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => navigate('/quotes')}
            >
              <span className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                My Quotations
              </span>
              {pendingQuotes > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingQuotes} pending</Badge>
              )}
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => navigate('/bookings')}
            >
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                My Bookings
              </span>
              {activeBookings > 0 && (
                <Badge className="ml-2">{activeBookings} active</Badge>
              )}
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => navigate('/profile/requests')}
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                My Requests
              </span>
            </Button>
          </CardContent>
        </Card>

        {/* Vendor Quick Access - for vendors only */}
        {isVendor && (
          <Card className="border-orange-200 dark:border-orange-800/50 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-gradient-to-br from-orange-500 to-amber-500">
                    <LayoutDashboard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Vendor Dashboard</h3>
                    <p className="text-xs text-muted-foreground">Manage requests & profile</p>
                  </div>
                </div>
                <Button 
                  size="sm"
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                  onClick={() => {
                    setActiveRole('vendor');
                    navigate('/vendor-dashboard');
                  }}
                >
                  Open
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vendor Section */}
        <Card className="border-card-border">
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
          <Card className="border-card-border">
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
        <Card className="border-card-border">
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

        {/* Change Password */}
        <Card className="border-card-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showPasswordSection ? (
              <Button variant="outline" className="w-full" onClick={() => setShowPasswordSection(true)}>
                <KeyRound className="h-4 w-4 mr-2" />
                Change my password
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Input
                    type={showCurrentPw ? 'text' : 'password'}
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowCurrentPw(!showCurrentPw)}>
                    {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showNewPw ? 'text' : 'password'}
                    placeholder="New password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowNewPw(!showNewPw)}>
                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setShowPasswordSection(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleChangePassword} disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}>
                    {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {isChangingPassword ? 'Changing...' : 'Update Password'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* About */}
        <Card className="border-card-border">
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
