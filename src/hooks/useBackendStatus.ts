import { useCallback, useEffect, useRef, useState } from 'react';

const PROBE_TIMEOUT_MS = 8000;
const POLL_INTERVAL_MS = 60_000;

export type BackendStatus = 'checking' | 'online' | 'offline';

/**
 * Lightweight reachability probe for the hosted backend.
 * When the backend is paused (or otherwise unreachable) every scheduled job —
 * daily admin brief, SMS digests, reminders — silently stops running.
 */
export function useBackendStatus() {
  const [status, setStatus] = useState<BackendStatus>('checking');
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const inFlight = useRef(false);

  const check = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;

    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

    if (!url || !key) {
      inFlight.current = false;
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

    try {
      const res = await fetch(`${url}/rest/v1/?apikey=${key}`, {
        method: 'GET',
        headers: { apikey: key },
        signal: controller.signal,
      });
      // Any HTTP answer (even 401/404) means the backend is awake.
      setStatus(res.status >= 500 ? 'offline' : 'online');
    } catch {
      setStatus('offline');
    } finally {
      clearTimeout(timer);
      setLastCheckedAt(new Date());
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [check]);

  return { status, lastCheckedAt, recheck: check };
}
