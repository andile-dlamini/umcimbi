import { AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBackendStatus } from '@/hooks/useBackendStatus';

const CLOUD_SETTINGS_URL =
  'https://lovable.dev/projects/29987a5e-df53-4430-9b8b-47eb7af8dff3?view=more&subview=cloud';

/**
 * Persistent admin-only banner shown whenever the hosted backend is unreachable
 * (typically paused). While paused, no scheduled job runs: the 07:00 SAST daily
 * brief, the SMS digests and the vendor reminders are all silently skipped.
 */
export function BackendStatusBanner() {
  const { status, lastCheckedAt, recheck } = useBackendStatus();

  if (status !== 'offline') return null;

  return (
    <div
      role="alert"
      className="border-b border-destructive/40 bg-destructive/10 px-4 py-3"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-destructive">
              Backend is paused — scheduled jobs are not running
            </p>
            <p className="text-sm text-muted-foreground">
              The daily admin brief, SMS digests and vendor reminders will stay
              skipped until the database is resumed.
              {lastCheckedAt && (
                <span className="ml-1 opacity-70">
                  Last checked {lastCheckedAt.toLocaleTimeString()}.
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:pl-8">
          <Button variant="outline" size="sm" onClick={recheck}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Re-check
          </Button>
          <Button size="sm" variant="destructive" asChild>
            <a href={CLOUD_SETTINGS_URL} target="_blank" rel="noreferrer">
              Resume in Cloud settings
              <ExternalLink className="ml-1.5 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BackendStatusBanner;
