import { supabase, isSupabaseConfigured } from './supabase';
import { StorageService } from './storage';
import type { WorkoutEntry } from '../types';
import { INITIAL_WORKOUT_LOGS } from '../constants/initialData';

/** Fetch the current member's workout logs */
export async function getWorkouts(): Promise<WorkoutEntry[]> {
  if (!isSupabaseConfigured) {
    return StorageService.get<WorkoutEntry[]>('apex_workouts', INITIAL_WORKOUT_LOGS);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!member) return [];

  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('member_id', member.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map((w) => ({
    id: w.id,
    exercise: w.exercise,
    weight: w.weight,
    sets: w.sets,
    reps: w.reps,
    date: formatRelativeDate(w.created_at),
    isPR: w.is_pr,
  }));
}

/** Log a new workout entry */
export async function addWorkout(
  entry: Omit<WorkoutEntry, 'id' | 'date'>
): Promise<{ success: boolean; workout?: WorkoutEntry; error?: string }> {
  const fullEntry: WorkoutEntry = {
    ...entry,
    id: `w-${Date.now()}`,
    date: 'Just now',
  };

  if (!isSupabaseConfigured) {
    const logs = await StorageService.get<WorkoutEntry[]>('apex_workouts', INITIAL_WORKOUT_LOGS);
    const updated = [fullEntry, ...logs];
    await StorageService.set('apex_workouts', updated);
    return { success: true, workout: fullEntry };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!member) return { success: false, error: 'Member profile not found' };

  const { data, error } = await supabase
    .from('workouts')
    .insert({
      member_id: member.id,
      exercise: entry.exercise,
      weight: entry.weight,
      sets: entry.sets,
      reps: entry.reps,
      is_pr: entry.isPR,
    })
    .select()
    .single();

  if (error || !data) return { success: false, error: error?.message };

  return {
    success: true,
    workout: {
      id: data.id,
      exercise: data.exercise,
      weight: data.weight,
      sets: data.sets,
      reps: data.reps,
      date: 'Just now',
      isPR: data.is_pr,
    },
  };
}

function formatRelativeDate(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(isoDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}
