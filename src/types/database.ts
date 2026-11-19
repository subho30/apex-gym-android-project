/**
 * Supabase Database Row Types
 * Generated from supabase/schema.sql — keep in sync manually or use `supabase gen types`.
 */

export interface DbMember {
  id: string;
  user_id: string | null;
  member_id: string;
  name: string;
  tier: string;
  status: 'Active' | 'Payment Due' | 'Expired' | 'Frozen';
  streak_days: number;
  next_renewal: string | null;
  card_last_4: string | null;
  is_checked_in: boolean;
  mobile: string;
  email: string | null;
  goal: string | null;
  home_club: string | null;
  coach: string | null;
  emergency_contact: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbClass {
  id: string;
  title: string;
  category: string;
  trainer: string;
  time: string;
  duration: string;
  room: string;
  capacity: number;
  booked_count: number;
  intensity: 'Low' | 'Moderate' | 'High' | 'Extreme';
  is_active: boolean;
  class_date: string;
  created_by: string | null;
  created_at: string;
}

export interface DbClassBooking {
  id: string;
  class_id: string;
  member_id: string;
  is_waitlist: boolean;
  created_at: string;
}

export interface DbWorkout {
  id: string;
  member_id: string;
  exercise: string;
  weight: string;
  sets: number;
  reps: number;
  is_pr: boolean;
  created_at: string;
}

export interface DbCheckIn {
  id: string;
  member_id: string | null;
  member_name: string;
  tier: string;
  gate: string;
  method: string;
  created_at: string;
}

export interface DbOccupancy {
  id: number;
  current_count: number;
  max_capacity: number;
  updated_at: string;
}

export interface DbLead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  source: string;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface DbGateToken {
  id: string;
  member_id: string;
  token: string;
  issued_at: string;
  expires_at: string;
  used: boolean;
  used_at: string | null;
}

export interface DbUserRole {
  id: string;
  user_id: string;
  role: 'member' | 'staff' | 'manager';
  created_at: string;
}
