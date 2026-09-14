import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function UpdateServiceAreas() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref');
  const preservedRef = ref ? `&ref=${encodeURIComponent(ref)}` : '';

  useEffect(() => {
    if (isLoading) return;

    let cancelled = false;
    (async () => {
      if (!user) {
        if (!cancelled) {
          navigate(`/auth?redirect=/update-service-areas${preservedRef}`, { replace: true });
        }
        return;
      }

      const { data: existingVendor, error } = await supabase
        .from('vendors')
        .select('id')
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error('UpdateServiceAreas vendor lookup error:', error);
        navigate('/vendor-dashboard', { replace: true });
        return;
      }

      if (existingVendor) {
        navigate('/profile/vendor?edit=1#service-areas', { replace: true });
      } else {
        navigate(`/complete-profile${preservedRef}`, { replace: true });
      }
    })();

    return () => { cancelled = true; };
  }, [user, isLoading, navigate, preservedRef]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Loading...</p>
    </div>
  );
}
