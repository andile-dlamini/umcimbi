import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          console.error('OAuth callback: no session', sessionError);
          navigate('/auth', { replace: true });
          return;
        }

        const userId = session.user.id;
        const metadata = session.user.user_metadata || {};

        // Check if profile is complete
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, phone_number')
          .eq('user_id', userId)
          .maybeSingle();

        const isComplete = profile?.first_name && profile?.phone_number;

        if (!isComplete) {
          // Pre-populate profile with Google metadata
          const updates: Record<string, string> = {};
          if (metadata.full_name) updates.full_name = metadata.full_name;
          if (metadata.avatar_url) updates.avatar_url = metadata.avatar_url;

          // Try to extract first_name from full_name if not already set
          if (metadata.full_name && !profile?.first_name) {
            const parts = metadata.full_name.split(' ');
            updates.first_name = parts[0];
            if (parts.length > 1) updates.surname = parts.slice(1).join(' ');
          }

          if (Object.keys(updates).length > 0) {
            await supabase.from('profiles').update(updates).eq('user_id', userId);
          }

          navigate('/auth?step=complete-profile', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('Something went wrong. Please try again.');
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <button onClick={() => navigate('/auth')} className="text-primary underline">
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
