import { Button } from "@/components/ui/button";

interface UpdateBannerProps {
  needRefresh: boolean;
  onRefresh: () => void;
}

export function UpdateBanner({ needRefresh, onRefresh }: UpdateBannerProps) {
  if (!needRefresh) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-background shadow-lg"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
        <p className="text-sm text-foreground">
          A new version of UMCIMBI is available.
        </p>
        <Button size="sm" onClick={onRefresh}>
          Refresh now
        </Button>
      </div>
    </div>
  );
}
