import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface DeliveryProofThumbnailsProps {
  proofs: { photos?: string[] | null }[];
}

export function DeliveryProofThumbnails({ proofs }: DeliveryProofThumbnailsProps) {
  const [signedUrls, setSignedUrls] = useState<string[]>([]);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  useEffect(() => {
    const paths = proofs.flatMap((p) => (p.photos ?? []) as string[]);
    if (paths.length === 0) {
      setSignedUrls([]);
      return;
    }
    let cancelled = false;
    Promise.all(
      paths.map(async (path) => {
        const { data } = await supabase.storage
          .from('delivery-proofs')
          .createSignedUrl(path, 300);
        return data?.signedUrl ?? '';
      })
    ).then((urls) => {
      if (!cancelled) setSignedUrls(urls.filter(Boolean));
    });
    return () => {
      cancelled = true;
    };
  }, [proofs]);

  if (signedUrls.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-3 gap-2 mb-2">
        {signedUrls.map((url, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveUrl(url)}
            className="rounded-md overflow-hidden border border-border focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <img
              src={url}
              alt={`Proof of delivery photo ${idx + 1}`}
              loading="lazy"
              className="w-full h-20 object-cover"
            />
          </button>
        ))}
      </div>

      <Dialog open={!!activeUrl} onOpenChange={(open) => !open && setActiveUrl(null)}>
        <DialogContent className="max-w-3xl p-2">
          {activeUrl && (
            <img
              src={activeUrl}
              alt="Proof of delivery"
              className="w-full h-auto rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
