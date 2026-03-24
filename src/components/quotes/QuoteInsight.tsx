import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles } from 'lucide-react';

interface QuoteInsightProps {
  quoteId: string;
  price: number;
  category: string;
  ceremonyType: string;
  vendorRating: number | null;
  reviewCount: number;
  isVerified: boolean;
  jobsCompleted: number;
  notes: string | null;
}

type Sentiment = 'good' | 'neutral' | 'caution';

const sentimentStyles: Record<Sentiment, { border: string; icon: string }> = {
  good: { border: 'border-emerald-400', icon: 'text-emerald-500' },
  caution: { border: 'border-amber-400', icon: 'text-amber-500' },
  neutral: { border: 'border-blue-300', icon: 'text-blue-400' },
};

export function QuoteInsight({ quoteId, price, category, ceremonyType, vendorRating, reviewCount, isVerified, jobsCompleted, notes }: QuoteInsightProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [sentiment, setSentiment] = useState<Sentiment>('neutral');
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ceremonyType) return;

    supabase.functions.invoke('analyse-quote', {
      body: { price, category, ceremonyType, vendorRating, reviewCount, isVerified, jobsCompleted, notes },
    }).then(({ data, error }) => {
      if (error || !data?.insight) {
        setFailed(true);
      } else {
        setInsight(data.insight.slice(0, 200));
        setSentiment(['good', 'neutral', 'caution'].includes(data.sentiment) ? data.sentiment : 'neutral');
      }
      setIsLoading(false);
    }).catch(() => {
      setFailed(true);
      setIsLoading(false);
    });
  }, [quoteId, ceremonyType]);

  if (failed) return null;

  if (isLoading) {
    return <div className="h-4 w-3/4 animate-pulse rounded bg-muted my-3" />;
  }

  const styles = sentimentStyles[sentiment];

  return (
    <div className={`rounded-lg border-l-4 ${styles.border} bg-muted/40 px-4 py-3 my-3 space-y-1`}>
      <div className="flex items-center gap-1.5">
        <Sparkles className={`h-4 w-4 ${styles.icon}`} />
        <span className="text-xs font-semibold text-muted-foreground">Umcimbi Insight</span>
      </div>
      <p className="text-sm text-foreground">{insight}</p>
    </div>
  );
}
