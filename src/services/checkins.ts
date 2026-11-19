import { apiFetch, realtime } from './apiClient';
import { StorageService } from './storage';
import type { CheckInFeedItem } from '../types';
import { INITIAL_CHECKIN_FEED } from '../constants/initialData';

export async function getCheckInFeed(limit = 8): Promise<CheckInFeedItem[]> {
  try {
    const data = await apiFetch<CheckInFeedItem[]>('/checkins');
    return data;
  } catch {
    return StorageService.get<CheckInFeedItem[]>('apex_feed', INITIAL_CHECKIN_FEED);
  }
}

export async function recordManualCheckIn(
  memberName: string,
  tier: string,
  method: string,
  gate = 'Front Desk Scanner'
): Promise<CheckInFeedItem | null> {
  try {
    const res = await apiFetch<{ success: boolean; entry: CheckInFeedItem }>('/checkins/manual', {
      method: 'POST',
      body: JSON.stringify({ memberName, tier, method, gate })
    });
    return res.entry;
  } catch {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const entry: CheckInFeedItem = {
      id: `chk-${Date.now()}`,
      member: memberName,
      tier,
      time: nowStr,
      method,
      gate
    };
    const feed = await StorageService.get<CheckInFeedItem[]>('apex_feed', INITIAL_CHECKIN_FEED);
    const updated = [entry, ...feed.slice(0, 7)];
    await StorageService.set('apex_feed', updated);
    return entry;
  }
}

export function subscribeToCheckIns(
  onNewCheckIn: (entry: CheckInFeedItem) => void
): (() => void) {
  return realtime.on('checkin:new', (data) => {
    onNewCheckIn(data);
  });
}
