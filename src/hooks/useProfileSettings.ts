import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { PreferredLanguage } from '@/types/database';

interface ProfileSettings {
  notifications_enabled: boolean;
  preferred_language: PreferredLanguage;
}

export function useProfileSettings() {
  const { user, profile } = useAuth();
  const [settings, setSettings] = useState<ProfileSettings>({
    notifications_enabled: true,
    preferred_language: 'english',
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('notifications_enabled, preferred_language')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile settings:', error);
    } else if (data) {
      setSettings({
        notifications_enabled: data.notifications_enabled ?? true,
        preferred_language: (data.preferred_language as PreferredLanguage) ?? 'english',
      });
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Update settings from profile when it changes
  useEffect(() => {
    if (profile) {
      setSettings(prev => ({
        ...prev,
        preferred_language: profile.preferred_language || 'english',
      }));
    }
  }, [profile]);

  const updateNotifications = async (enabled: boolean): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from('profiles')
      .update({ notifications_enabled: enabled })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating notifications:', error);
      toast.error('Failed to update notification settings');
      return false;
    }

    setSettings(prev => ({ ...prev, notifications_enabled: enabled }));
    toast.success(enabled ? 'Notifications enabled' : 'Notifications disabled');
    return true;
  };

  const updateLanguage = async (language: PreferredLanguage): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from('profiles')
      .update({ preferred_language: language })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating language:', error);
      toast.error('Failed to update language');
      return false;
    }

    setSettings(prev => ({ ...prev, preferred_language: language }));
    toast.success(`Language changed to ${language === 'zulu' ? 'isiZulu' : 'English'}`);
    return true;
  };

  return {
    settings,
    isLoading,
    updateNotifications,
    updateLanguage,
    refreshSettings: fetchSettings,
  };
}
