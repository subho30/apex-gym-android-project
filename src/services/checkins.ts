import { supabase, isSupabaseConfigured } from './supabase';
import { StorageService } from './storage';
import type { CheckInFeedItem } from '../types';
import { INITIAL_CHECKIN_FEED } from '../constants/initialData';

/** Fetch the latest check-in feed entries */
export async function getCheckInFeed(limit = 8): Promise<CheckInFeedItem[]> {
  if (!isSupabaseConfigured) {
    return StorageService.get<CheckInFeedItem[]>('apex_feed', INITIAL_CHECKIN_FEED);
  }

  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    member: row.member_name,
    tier: row.tier,
    time: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    method: row.method,
    gate: row.gate,
  }));
}

/** Record a manual check-in (staff action — bypasses QR token flow) */
export async function recordManualCheckIn(
  memberName: string,
  tier: string,
  method: string,
  gate = 'Front Desk Scanner'
): Promise<CheckInFeedItem | null> {
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const entry: CheckInFeedItem = {
    id: `chk-${Date.now()}`,
    member: memberName,
    tier,
    time: nowStr,
    method,
    gate,
  };

  if (!isSupabaseConfigured) {
    const feed = await StorageService.get<CheckInFeedItem[]>('apex_feed', INITIAL_CHECKIN_FEED);
    const updated = [entry, ...feed.slice(0, 7)];
    await StorageService.set('apex_feed', updated);
    return entry;
  }

  const { error } = await supabase.from('check_ins').insert({
    member_name: memberName,
    tier,
    method,
    gate,
  });

  if (error) {
    console.error('Failed to record check-in:', error);
    return null;
  }

  return entry;
}

/** Subscribe to real-time check-in feed updates */
export function subscribeToCheckIns(
  onNewCheckIn: (entry: CheckInFeedItem) => void
): (() => void) | null {
  if (!isSupabaseConfigured) return null;

  const channel = supabase
    .channel('checkins-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'check_ins' },
      (payload) => {
        const row = payload.new as Record<string, unknown>;
        onNewCheckIn({
          id: row.id as string,
          member: row.member_name as string,
          tier: row.tier as string,
          time: new Date(row.created_at as string).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          method: row.method as string,
          gate: row.gate as string,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
