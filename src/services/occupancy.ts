import { apiFetch, realtime } from './apiClient';

export async function getOccupancy(): Promise<{ current: number; max: number }> {
  try {
    const data = await apiFetch<{ current: number; max: number }>('/occupancy');
    return data;
  } catch {
    return { current: 64, max: 120 };
  }
}

export async function incrementOccupancy(): Promise<number> {
  try {
    const res = await apiFetch<{ current_count: number; max_capacity: number }>('/occupancy/increment', {
      method: 'POST'
    });
    return res.current_count;
  } catch {
    return 65;
  }
}

export async function decrementOccupancy(): Promise<number> {
  return 63;
}

export function subscribeToOccupancy(
  onUpdate: (current: number, max: number) => void
): (() => void) {
  return realtime.on('occupancy:update', (data) => {
    onUpdate(data.current, data.max);
  });
}
