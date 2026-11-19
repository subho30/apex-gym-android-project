import { apiFetch } from './apiClient';
import { StorageService } from './storage';
import type { WorkoutEntry } from '../types';
import { INITIAL_WORKOUT_LOGS } from '../constants/initialData';

export async function getWorkouts(): Promise<WorkoutEntry[]> {
  try {
    const data = await apiFetch<WorkoutEntry[]>('/workouts');
    return data;
  } catch {
    return StorageService.get<WorkoutEntry[]>('apex_workouts', INITIAL_WORKOUT_LOGS);
  }
}

export async function addWorkout(
  entry: Omit<WorkoutEntry, 'id' | 'date'>
): Promise<{ success: boolean; workout?: WorkoutEntry; error?: string }> {
  try {
    const res = await apiFetch<{ success: boolean; workout: WorkoutEntry }>('/workouts', {
      method: 'POST',
      body: JSON.stringify(entry)
    });
    return res;
  } catch {
    const fullEntry: WorkoutEntry = {
      ...entry,
      id: `w-${Date.now()}`,
      date: 'Just now'
    };
    const logs = await StorageService.get<WorkoutEntry[]>('apex_workouts', INITIAL_WORKOUT_LOGS);
    const updated = [fullEntry, ...logs];
    await StorageService.set('apex_workouts', updated);
    return { success: true, workout: fullEntry };
  }
}
