import { supabase, isSupabaseConfigured } from './supabase';
import { StorageService } from './storage';
import type { GymClass } from '../types';
import type { DbClass, DbClassBooking } from '../types/database';
import { INITIAL_CLASSES } from '../constants/initialData';

function dbToClass(row: DbClass, myBookings: Set<string>): GymClass {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    trainer: row.trainer,
    time: row.time,
    duration: row.duration,
    room: row.room,
    capacity: row.capacity,
    bookedCount: row.booked_count,
    isBookedByMe: myBookings.has(row.id),
    waitlistCount: 0, // computed separately if needed
    intensity: row.intensity,
    roster: [], // populated via bookings join if needed
  };
}

/** Fetch all classes for today, with the current user's booking status */
export async function getClasses(): Promise<GymClass[]> {
  if (!isSupabaseConfigured) {
    return StorageService.get<GymClass[]>('apex_classes', INITIAL_CLASSES);
  }

  const { data: classes, error } = await supabase
    .from('classes')
    .select('*')
    .eq('is_active', true)
    .order('time', { ascending: true });

  if (error || !classes) return [];

  // Fetch current user's bookings
  const myBookings = new Set<string>();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: myMember } = await supabase
      .from('members')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (myMember) {
      const { data: bookings } = await supabase
        .from('class_bookings')
        .select('class_id')
        .eq('member_id', myMember.id);

      if (bookings) {
        bookings.forEach((b: { class_id: string }) => myBookings.add(b.class_id));
      }
    }
  }

  return (classes as DbClass[]).map((c) => dbToClass(c, myBookings));
}

/** Book a class slot for the current member */
export async function bookClass(classId: string): Promise<{ success: boolean; waitlist?: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    const classes = await StorageService.get<GymClass[]>('apex_classes', INITIAL_CLASSES);
    const updated = classes.map((cls) => {
      if (cls.id !== classId) return cls;
      const isFull = cls.bookedCount >= cls.capacity;
      return {
        ...cls,
        isBookedByMe: true,
        bookedCount: isFull ? cls.bookedCount : cls.bookedCount + 1,
        waitlistCount: isFull ? cls.waitlistCount + 1 : cls.waitlistCount,
      };
    });
    await StorageService.set('apex_classes', updated);
    const cls = updated.find((c) => c.id === classId);
    return { success: true, waitlist: cls ? cls.bookedCount > cls.capacity : false };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!member) return { success: false, error: 'Member profile not found' };

  // Check if class is at capacity
  const { data: cls } = await supabase
    .from('classes')
    .select('capacity, booked_count')
    .eq('id', classId)
    .single();

  const isWaitlist = cls ? cls.booked_count >= cls.capacity : false;

  const { error } = await supabase
    .from('class_bookings')
    .insert({
      class_id: classId,
      member_id: member.id,
      is_waitlist: isWaitlist,
    });

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Already booked' };
    return { success: false, error: error.message };
  }

  return { success: true, waitlist: isWaitlist };
}

/** Cancel a class booking for the current member */
export async function cancelBooking(classId: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    const classes = await StorageService.get<GymClass[]>('apex_classes', INITIAL_CLASSES);
    const updated = classes.map((cls) => {
      if (cls.id !== classId) return cls;
      return {
        ...cls,
        isBookedByMe: false,
        bookedCount: Math.max(0, cls.bookedCount - 1),
      };
    });
    await StorageService.set('apex_classes', updated);
    return { success: true };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!member) return { success: false, error: 'Member profile not found' };

  const { error } = await supabase
    .from('class_bookings')
    .delete()
    .eq('class_id', classId)
    .eq('member_id', member.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Create a new class (staff/manager action) */
export async function createClass(
  cls: Omit<GymClass, 'id' | 'bookedCount' | 'isBookedByMe' | 'waitlistCount' | 'roster'>
): Promise<{ success: boolean; newClass?: GymClass; error?: string }> {
  if (!isSupabaseConfigured) {
    const newClass: GymClass = {
      ...cls,
      id: `cls-${Date.now()}`,
      bookedCount: 0,
      isBookedByMe: false,
      waitlistCount: 0,
      roster: [],
    };
    const classes = await StorageService.get<GymClass[]>('apex_classes', INITIAL_CLASSES);
    const updated = [newClass, ...classes];
    await StorageService.set('apex_classes', updated);
    return { success: true, newClass };
  }

  const { data, error } = await supabase
    .from('classes')
    .insert({
      title: cls.title,
      category: cls.category,
      trainer: cls.trainer,
      time: cls.time,
      duration: cls.duration,
      room: cls.room,
      capacity: cls.capacity,
      intensity: cls.intensity,
    })
    .select()
    .single();

  if (error || !data) return { success: false, error: error?.message };

  const newClass: GymClass = {
    id: data.id,
    title: data.title,
    category: data.category,
    trainer: data.trainer,
    time: data.time,
    duration: data.duration,
    room: data.room,
    capacity: data.capacity,
    bookedCount: 0,
    isBookedByMe: false,
    waitlistCount: 0,
    intensity: data.intensity,
    roster: [],
  };

  return { success: true, newClass };
}

/** Subscribe to real-time class changes */
export function subscribeToClasses(onUpdate: () => void): (() => void) | null {
  if (!isSupabaseConfigured) return null;

  const channel = supabase
    .channel('classes-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, () => {
      onUpdate();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'class_bookings' }, () => {
      onUpdate();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
