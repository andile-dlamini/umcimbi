import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Status = 'green' | 'yellow' | 'red' | 'error';

interface BalanceRow {
  id: string;
  balance: number;
  status: Status;
  checked_at: string;
}

const dotClass: Record<Status, string> = {
  green: 'bg-emerald-500 shadow-[0_0_0_4px_hsl(var(--background))_inset,0_0_8px_hsl(142_71%_45%/0.6)]',
  yellow: 'bg-amber-500 shadow-[0_0_0_4px_hsl(var(--background))_inset,0_0_8px_hsl(38_92%_50%/0.6)]',
  red: 'bg-red-500 shadow-[0_0_0_4px_hsl(var(--background))_inset,0_0_8px_hsl(0_84%_60%/0.6)]',
  error: 'bg-muted-foreground',
};

const statusLabel: Record<Status, string> = {
  green: 'Healthy',
  yellow: 'Top up soon',
  red: 'Recharge needed',
  error: 'Check failed',
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });
}

export function SmsBalanceCard() {
  const [row, setRow] = useState<BalanceRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLatest = useCallback(async () => {
    const { data, error } = await supabase
      .from('sms_balance_checks')
      .select('id, balance, status, checked_at')
      .order('checked_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error('Failed to load sms balance', error);
    } else {
      setRow(data as BalanceRow | null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadLatest();
  }, [loadLatest]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-sms-balance-checks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sms_balance_checks' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const next = payload.new as BalanceRow;
            setRow((current) => {
              if (!current) return next;
              return new Date(next.checked_at) >= new Date(current.checked_at) ? next : current;
            });
            setLoading(false);
            return;
          }

          loadLatest();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadLatest]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-sms-balance', {
        method: 'POST',
      });
      if (error) throw error;
      toast.success(`Balance: ${data?.balance ?? 'unknown'}`);
      await loadLatest();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? 'Failed to check balance');
    } finally {
      setRefreshing(false);
    }
  };

  const status: Status = (row?.status as Status) ?? 'error';

  return (
    <Card>
      <CardHeader className="pb-3 flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            SMS Credits (Connect Mobile)
          </CardTitle>
          <CardDescription className="mt-1">
            OTP delivery balance · auto-checked daily at 08:00 SAST
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="h-8"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : !row ? (
          <div className="text-sm text-muted-foreground">
            No checks yet. Click refresh to fetch the current balance.
          </div>
        ) : (
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full ${dotClass[status]}`}
                aria-label={statusLabel[status]}
              />
              <div>
                <p className="text-3xl font-bold leading-none">
                  {row.balance >= 0 ? row.balance.toLocaleString() : '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {statusLabel[status]} · last checked {formatTime(row.checked_at)}
                </p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground ml-auto">
              <div>🟢 &gt; 200</div>
              <div>🟡 50–200</div>
              <div>🔴 &lt; 50</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
