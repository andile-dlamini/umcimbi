import { useState } from 'react';
import { Settings, Webhook, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AdminSettings() {
  const [registering, setRegistering] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleRegisterWebhook = async () => {
    setRegistering(true);
    setWebhookStatus('idle');
    try {
      const { data, error } = await supabase.functions.invoke('register-yoco-webhook', {
        body: { action: 'register' },
      });

      if (error) throw error;

      setWebhookStatus('success');
      toast.success(data.message || 'Webhook registered successfully');
    } catch (err: any) {
      console.error('Webhook registration failed:', err);
      setWebhookStatus('error');
      toast.error('Failed to register webhook. Check console for details.');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform configuration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Webhook className="h-5 w-5 text-primary" />
            Yoco Payment Webhook
          </CardTitle>
          <CardDescription>
            Register the payment webhook so Yoco can notify us when payments succeed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button onClick={handleRegisterWebhook} disabled={registering}>
              {registering ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registering…
                </>
              ) : (
                'Register Webhook'
              )}
            </Button>

            {webhookStatus === 'success' && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Registered</span>
              </span>
            )}
            {webhookStatus === 'error' && (
              <span className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                Failed
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-5 w-5 text-primary" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Platform-wide settings including fee structures, notification templates,
            vendor onboarding rules, and feature flags.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
