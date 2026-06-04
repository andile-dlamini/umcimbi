import { useState, useEffect, useRef } from 'react';
import { Download, X, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const STORAGE_KEY = 'umcimbi_pwa_dismissed_at';
const REPROMPT_DAYS = 10;

function detectIOS(): boolean {
  const ua = navigator.userAgent;
  const legacy = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const modern =
    navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return legacy || modern;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );
}

function shouldShow(): boolean {
  if (isStandalone()) return false;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return true;
  if (raw === 'installed') return false;
  const dismissedAt = parseInt(raw, 10);
  if (isNaN(dismissedAt)) return true;
  const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
  return daysSince >= REPROMPT_DAYS;
}

export function InstallPrompt() {
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);
  const [isIOS] = useState(() => detectIOS());
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstallAndroid, setCanInstallAndroid] = useState(false);

  useEffect(() => {
    if (!isMobile) return;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setCanInstallAndroid(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const timer = window.setTimeout(() => {
      if (shouldShow()) setVisible(true);
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.clearTimeout(timer);
    };
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile || !isIOS) return;
    const timer = window.setTimeout(() => {
      if (shouldShow()) setVisible(true);
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [isMobile, isIOS]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setVisible(false);
  };

  const handleInstall = async () => {
    if (canInstallAndroid && deferredPrompt.current) {
      await deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      localStorage.setItem(
        STORAGE_KEY,
        outcome === 'accepted' ? 'installed' : String(Date.now())
      );
      deferredPrompt.current = null;
      setVisible(false);
    }
  };

  if (!isMobile || !visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleDismiss}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in"
      />

      {/* Bottom sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-install-title"
        className="fixed bottom-0 inset-x-0 z-50 bg-background rounded-t-3xl px-6 pt-3 pb-8 shadow-2xl border-t border-border animate-in slide-in-from-bottom duration-300"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        {/* Drag handle */}
        <div className="mx-auto h-1.5 w-12 rounded-full bg-muted mb-4" />

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon */}
        <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 grid place-items-center mb-4">
          <Download className="h-7 w-7 text-primary" />
        </div>

        {/* Text */}
        <h3
          id="pwa-install-title"
          className="text-xl font-fraunces text-center text-foreground"
        >
          Add UMCIMBI to your Home Screen
        </h3>
        <p className="text-sm text-muted-foreground text-center mt-2 max-w-sm mx-auto">
          Install the app for a faster, full-screen experience — access your
          ceremonies and vendors anytime.
        </p>

        {/* iOS instructions */}
        {isIOS && !canInstallAndroid && (
          <div className="mt-5 rounded-xl bg-muted/50 border border-border p-4 text-sm text-muted-foreground text-center leading-relaxed">
            Tap the{' '}
            <Share className="inline h-4 w-4 mx-0.5 -mt-0.5 text-primary" />{' '}
            Share button in Safari, then tap{' '}
            <span className="font-semibold text-foreground">
              "Add to Home Screen"
            </span>
            .
          </div>
        )}

        {/* Android install button */}
        {canInstallAndroid && (
          <Button onClick={handleInstall} className="w-full mt-5 h-11">
            <Download className="h-4 w-4" />
            Add to Home Screen
          </Button>
        )}

        {/* Maybe later */}
        <button
          onClick={handleDismiss}
          className="w-full mt-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Maybe later
        </button>
      </div>
    </>
  );
}
