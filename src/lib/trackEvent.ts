import { supabase } from '@/integrations/supabase/client';

interface TrackEventPayload {
  event_type: string;
  actor_type: 'organiser' | 'vendor' | 'system' | 'admin';
  actor_id?: string;
  ceremony_type?: string;
  metadata?: Record<string, unknown>;
}

function getSessionId(): string {
  const key = 'umcimbi_session_id';
  try {
    let sid = sessionStorage.getItem(key);
    if (!sid) {
      sid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem(key, sid);
    }
    return sid;
  } catch {
    return `nosession-${Date.now()}`;
  }
}

export async function trackEvent(payload: TrackEventPayload): Promise<void> {
  try {
    await (supabase.from('platform_events' as never) as never as { insert: (row: unknown) => Promise<unknown> }).insert({
      event_type: payload.event_type,
      actor_type: payload.actor_type,
      actor_id: payload.actor_id ?? null,
      session_id: getSessionId(),
      ceremony_type: payload.ceremony_type ?? null,
      metadata: payload.metadata ?? {},
    });
  } catch {
    // Silent — tracking must never interrupt the user experience
  }
}
