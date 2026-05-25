import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State = 'loading' | 'valid' | 'already' | 'invalid' | 'success' | 'error';

export default function EmailUnsubscribe() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [state, setState] = useState<State>('loading');
  const [email, setEmail] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setState('invalid'); return; }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } }
        );
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.valid) {
          setEmail(data.email || '');
          setState(data.alreadyUnsubscribed ? 'already' : 'valid');
        } else {
          setState('invalid');
        }
      } catch {
        setState('invalid');
      }
    })();
  }, [token]);

  const confirm = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('handle-email-unsubscribe', {
        body: { token },
      });
      setState(error ? 'error' : 'success');
    } catch {
      setState('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Email preferences</h1>
          {state === 'loading' && <p className="text-muted-foreground">Loading…</p>}
          {state === 'invalid' && (
            <p className="text-muted-foreground">This unsubscribe link is invalid or expired.</p>
          )}
          {state === 'already' && (
            <p className="text-muted-foreground">{email} is already unsubscribed.</p>
          )}
          {state === 'valid' && (
            <>
              <p className="text-muted-foreground">
                Unsubscribe <span className="font-medium text-foreground">{email}</span> from
                UMCIMBI emails?
              </p>
              <Button className="w-full" onClick={confirm} disabled={submitting}>
                {submitting ? 'Unsubscribing…' : 'Confirm unsubscribe'}
              </Button>
            </>
          )}
          {state === 'success' && (
            <p className="text-foreground">You've been unsubscribed. We're sorry to see you go.</p>
          )}
          {state === 'error' && (
            <p className="text-destructive">Something went wrong. Please try again later.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
