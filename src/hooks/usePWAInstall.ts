import { useState, useEffect, useRef, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function detectIOS(): boolean {
  // Modern iOS Safari may omit "iPhone" from userAgent (request desktop site)
  // so also check platform and maxTouchPoints
  const ua = navigator.userAgent;
  const legacyCheck = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const modernCheck =
    navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return legacyCheck || modernCheck;
}

export function usePWAInstall() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS] = useState(() => detectIOS());

  // Also detect if already installed as standalone
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true;

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const triggerInstall = useCallback(async () => {
    const prompt = deferredPrompt.current;
    if (!prompt) return;

    await prompt.prompt();
    const { outcome } = await prompt.userChoice;

    if (outcome === 'accepted') {
      deferredPrompt.current = null;
      setIsInstallable(false);
    }
  }, []);

  return { isInstallable, isIOS, isStandalone, triggerInstall };
}
