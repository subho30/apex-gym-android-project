import { supabase, isSupabaseConfigured } from './supabase';

/** Fetch the current live occupancy count */
export async function getOccupancy(): Promise<{ current: number; max: number }> {
  if (!isSupabaseConfigured) {
    return { current: 64, max: 120 }; // demo default
  }

  const { data, error } = await supabase
    .from('occupancy')
    .select('current_count, max_capacity')
    .eq('id', 1)
    .single();

  if (error || !data) return { current: 0, max: 120 };
  return { current: data.current_count, max: data.max_capacity };
}

/** Increment occupancy (called after successful check-in) */
export async function incrementOccupancy(): Promise<number> {
  if (!isSupabaseConfigured) return 65;

  const { error } = await supabase.rpc('increment_occupancy');
  if (error) console.error('Failed to increment occupancy:', error);

  const result = await getOccupancy();
  return result.current;
}

/** Decrement occupancy (checkout) */
export async function decrementOccupancy(): Promise<number> {
  if (!isSupabaseConfigured) return 63;

  const { error } = await supabase.rpc('decrement_occupancy');
  if (error) console.error('Failed to decrement occupancy:', error);

  const result = await getOccupancy();
  return result.current;
}

/** Subscribe to real-time occupancy changes */
export function subscribeToOccupancy(
  onUpdate: (current: number, max: number) => void
): (() => void) | null {
  if (!isSupabaseConfigured) return null;

  const channel = supabase
    .channel('occupancy-realtime')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'occupancy', filter: 'id=eq.1' },
      (payload) => {
        const row = payload.new as { current_count: number; max_capacity: number };
        onUpdate(row.current_count, row.max_capacity);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
