import { ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminOperations() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Operations Queue</h1>
        <p className="text-sm text-muted-foreground mt-1">Pending actions and operational items</p>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-5 w-5 text-primary" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This section will include a unified queue for vendor verifications, dispute resolutions,
            flagged content reviews, and support escalations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
