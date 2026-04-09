import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const transactionRef = searchParams.get('TransactionReference') || '';

  useEffect(() => {
    const timer = setTimeout(() => navigate('/bookings', { replace: true }), 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Payment Received</h1>
          <p className="text-muted-foreground">
            Payment received — we'll confirm once your bank clears it.
          </p>
          {transactionRef && (
            <p className="text-xs text-muted-foreground font-mono">Ref: {transactionRef}</p>
          )}
          <p className="text-sm text-muted-foreground">Redirecting to your bookings…</p>
        </CardContent>
      </Card>
    </div>
  );
}
