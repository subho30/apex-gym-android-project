import { apiFetch, realtime } from './apiClient';
import { StorageService } from './storage';
import type { GymClass } from '../types';
import { INITIAL_CLASSES } from '../constants/initialData';

export async function getClasses(): Promise<GymClass[]> {
  try {
    const data = await apiFetch<GymClass[]>('/classes');
    return data;
  } catch {
    return StorageService.get<GymClass[]>('apex_classes', INITIAL_CLASSES);
  }
}

export async function bookClass(classId: string): Promise<{ success: boolean; waitlist?: boolean; error?: string }> {
  try {
    const res = await apiFetch<{ success: boolean; waitlist?: boolean }>(`/classes/${classId}/book`, {
      method: 'POST'
    });
    return res;
  } catch (err: any) {
    // Local fallback
    const classes = await StorageService.get<GymClass[]>('apex_classes', INITIAL_CLASSES);
    const updated = classes.map((cls) => {
      if (cls.id !== classId) return cls;
      const isFull = cls.bookedCount >= cls.capacity;
      return {
        ...cls,
        isBookedByMe: true,
        bookedCount: isFull ? cls.bookedCount : cls.bookedCount + 1,
        waitlistCount: isFull ? cls.waitlistCount + 1 : cls.waitlistCount
      };
    });
    await StorageService.set('apex_classes', updated);
    const cls = updated.find((c) => c.id === classId);
    return { success: true, waitlist: cls ? cls.bookedCount > cls.capacity : false };
  }
}

export async function cancelBooking(classId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await apiFetch<{ success: boolean }>(`/classes/${classId}/cancel`, {
      method: 'POST'
    });
    return res;
  } catch {
    const classes = await StorageService.get<GymClass[]>('apex_classes', INITIAL_CLASSES);
    const updated = classes.map((cls) => {
      if (cls.id !== classId) return cls;
      return {
        ...cls,
        isBookedByMe: false,
        bookedCount: Math.max(0, cls.bookedCount - 1)
      };
    });
    await StorageService.set('apex_classes', updated);
    return { success: true };
  }
}

export async function createClass(
  cls: Omit<GymClass, 'id' | 'bookedCount' | 'isBookedByMe' | 'waitlistCount' | 'roster'>
): Promise<{ success: boolean; newClass?: GymClass; error?: string }> {
  try {
    const res = await apiFetch<{ success: boolean; id: string }>('/classes', {
      method: 'POST',
      body: JSON.stringify(cls)
    });
    const newClass: GymClass = {
      ...cls,
      id: res.id,
      bookedCount: 0,
      isBookedByMe: false,
      waitlistCount: 0,
      roster: []
    };
    return { success: true, newClass };
  } catch {
    const newClass: GymClass = {
      ...cls,
      id: `cls-${Date.now()}`,
      bookedCount: 0,
      isBookedByMe: false,
      waitlistCount: 0,
      roster: []
    };
    const classes = await StorageService.get<GymClass[]>('apex_classes', INITIAL_CLASSES);
    const updated = [newClass, ...classes];
    await StorageService.set('apex_classes', updated);
    return { success: true, newClass };
  }
}

export function subscribeToClasses(onUpdate: () => void): (() => void) {
  return realtime.on('class:update', onUpdate);
}
