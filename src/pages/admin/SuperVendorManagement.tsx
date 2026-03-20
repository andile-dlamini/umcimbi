import { useState, useEffect } from 'react';
import { Star, CheckCircle2, XCircle, Briefcase, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { Progress } from '@/components/ui/progress';
import { SUPER_VENDOR_MIN_JOBS, SUPER_VENDOR_MIN_RATING } from '@/lib/umcimbiScore';

interface VendorRow {
  id: string;
  name: string;
  is_super_vendor: boolean;
  super_vendor_awarded_at: string | null;
  rating: number;
  review_count: number;
  jobs_completed: number;
}

export default function SuperVendorManagement() {
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('vendors')
        .select('id, name, is_super_vendor, super_vendor_awarded_at, rating, review_count, jobs_completed')
        .eq('is_active', true)
        .order('is_super_vendor', { ascending: false })
        .order('jobs_completed', { ascending: false });
      setVendors((data || []) as VendorRow[]);
      setIsLoading(false);
    };
    fetch();
  }, []);

  const meetsJobs = (v: VendorRow) => v.jobs_completed >= SUPER_VENDOR_MIN_JOBS;
  const meetsRating = (v: VendorRow) => v.rating >= SUPER_VENDOR_MIN_RATING;
  const jobsProgress = (v: VendorRow) => Math.min((v.jobs_completed / SUPER_VENDOR_MIN_JOBS) * 100, 100);

  const superCount = vendors.filter(v => v.is_super_vendor).length;

  return (
    <div className="min-h-screen pb-safe bg-background">
      <PageHeader title="Super Vendor Management" showBack />
      <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
        {/* Info banner */}
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-4 text-sm space-y-1">
            <p className="font-medium flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              Automatic Super Vendor
            </p>
            <p className="text-muted-foreground">
              Status is awarded automatically when a vendor completes{' '}
              <strong>{SUPER_VENDOR_MIN_JOBS}+ jobs</strong> with a{' '}
              <strong>{SUPER_VENDOR_MIN_RATING}+ rating</strong>. No manual action needed.
            </p>
            <p className="text-muted-foreground">
              Currently <strong>{superCount}</strong> Super Vendor{superCount !== 1 ? 's' : ''}.
            </p>
          </CardContent>
        </Card>

        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : vendors.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No vendors found</p>
        ) : (
          vendors.map((vendor) => (
            <Card key={vendor.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm flex items-center gap-1.5">
                      {vendor.name}
                      {vendor.is_super_vendor && (
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      )}
                    </p>
                    {vendor.is_super_vendor && vendor.super_vendor_awarded_at && (
                      <p className="text-xs text-muted-foreground">
                        Since {new Date(vendor.super_vendor_awarded_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {vendor.is_super_vendor ? (
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300">
                      Super Vendor
                    </Badge>
                  ) : meetsJobs(vendor) && meetsRating(vendor) ? (
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      Eligible
                    </Badge>
                  ) : null}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Briefcase className="h-3 w-3" /> Jobs
                      </span>
                      <span className="flex items-center gap-1">
                        {vendor.jobs_completed}/{SUPER_VENDOR_MIN_JOBS}
                        {meetsJobs(vendor) ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-muted-foreground" />
                        )}
                      </span>
                    </div>
                    <Progress value={jobsProgress(vendor)} className="h-1.5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <TrendingUp className="h-3 w-3" /> Rating
                      </span>
                      <span className="flex items-center gap-1">
                        {vendor.rating ?? 0}/{SUPER_VENDOR_MIN_RATING}
                        {meetsRating(vendor) ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-muted-foreground" />
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ({vendor.review_count} review{vendor.review_count !== 1 ? 's' : ''})
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
