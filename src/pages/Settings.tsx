import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Bell, KeyRound, Eye, EyeOff, Loader2, Store, Shield, Edit2, Save, X, LayoutDashboard, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AvatarUpload } from '@/components/shared/AvatarUpload';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { useProfileSettings } from '@/hooks/useProfileSettings';
import { PreferredLanguage } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { profile, user, isVendor, isAdmin, refreshProfile } = useAuth();
  const { activeRole, setActiveRole, canSwitchRole } = useRole();
  const { settings, isLoading: settingsLoading, updateNotifications, updateLanguage } = useProfileSettings();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({ full_name: '', phone_number: '' });

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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
      .update({ full_name: editData.full_name || null, phone_number: editData.phone_number || null })
      .eq('user_id', user.id);
    if (error) {
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
    const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('user_id', user.id);
    if (error) toast.error('Failed to save avatar');
    else refreshProfile?.();
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setIsChangingPassword(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: user?.email || '', password: currentPassword });
      if (signInError) { toast.error('Current password is incorrect'); setIsChangingPassword(false); return; }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) toast.error(error.message);
      else { toast.success('Password changed'); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setShowPasswordSection(false); }
    } catch { toast.error('Failed to change password'); }
    setIsChangingPassword(false);
  };

  return (
    <div className="min-h-screen pb-safe">
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <h2 className="text-xl font-semibold text-foreground">Settings</h2>

        {/* User Info Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <AvatarUpload avatarUrl={(profile as any)?.avatar_url || null} onAvatarChange={handleAvatarChange} size="lg" />
                {isEditing ? (
                  <div className="space-y-2">
                    <Input value={editData.full_name} onChange={(e) => setEditData({ ...editData, full_name: e.target.value })} placeholder="Full name" className="h-8" />
                    <Input value={editData.phone_number} onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })} placeholder="Phone number" className="h-8" />
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{profile?.full_name || 'User'}</h3>
                    {user?.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
                    {profile?.phone_number && <p className="text-sm text-muted-foreground">{profile.phone_number}</p>}
                    <div className="flex gap-1.5 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {activeRole === 'vendor' ? 'Vendor' : 'Organiser'}
                      </Badge>
                      {isAdmin && <Badge variant="outline" className="text-xs">Admin</Badge>}
                    </div>
                  </div>
                )}
              </div>
              {isEditing ? (
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}><X className="h-4 w-4" /></Button>
                  <Button size="icon" onClick={handleSaveProfile} disabled={isSaving}><Save className="h-4 w-4" /></Button>
                </div>
              ) : (
                <Button size="icon" variant="ghost" onClick={startEditing}><Edit2 className="h-4 w-4" /></Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vendor Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Store className="h-4 w-4" /> Vendor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isVendor ? (
              <>
                {canSwitchRole && (
                  <Button variant="outline" className="w-full justify-between" onClick={() => { setActiveRole(activeRole === 'vendor' ? 'organiser' : 'vendor'); }}>
                    Switch to {activeRole === 'vendor' ? 'Organiser' : 'Vendor'} mode
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="outline" className="w-full" onClick={() => navigate('/profile/vendor')}>
                  Edit Vendor Profile
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Offer services for traditional ceremonies?</p>
                <Button className="w-full" onClick={() => navigate('/vendors/onboarding')}>
                  <Store className="h-4 w-4 mr-2" /> Become a vendor
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm">Language</Label>
              </div>
              <Select value={settings.preferred_language} onValueChange={(v) => updateLanguage(v as PreferredLanguage)} disabled={settingsLoading}>
                <SelectTrigger className="w-[110px] h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="zulu">isiZulu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm">Notifications</Label>
              </div>
              <Switch checked={settings.notifications_enabled} onCheckedChange={updateNotifications} disabled={settingsLoading} />
            </div>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <KeyRound className="h-4 w-4" /> Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showPasswordSection ? (
              <Button variant="outline" size="sm" onClick={() => setShowPasswordSection(true)}>Change password</Button>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Input type={showCurrentPw ? 'text' : 'password'} placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowCurrentPw(!showCurrentPw)}>
                    {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="relative">
                  <Input type={showNewPw ? 'text' : 'password'} placeholder="New password (min 6)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowNewPw(!showNewPw)}>
                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => { setShowPasswordSection(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}>Cancel</Button>
                  <Button size="sm" className="flex-1" onClick={handleChangePassword} disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}>
                    {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    {isChangingPassword ? 'Saving...' : 'Update'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin */}
        {isAdmin && (
          <Card>
            <CardContent className="p-4">
              <Button variant="outline" className="w-full" onClick={() => navigate('/admin')}>
                <Shield className="h-4 w-4 mr-2" /> Admin Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
