import { supabase, isSupabaseConfigured } from './supabase';
import { StorageService } from './storage';
import type { MemberProfile } from '../types';
import type { DbMember } from '../types/database';
import { INITIAL_MEMBERS } from '../constants/initialData';

function dbToMember(row: DbMember): MemberProfile {
  return {
    id: row.id,
    memberId: row.member_id,
    name: row.name,
    tier: row.tier,
    status: row.status as MemberProfile['status'],
    streakDays: row.streak_days,
    nextRenewal: row.next_renewal || '',
    cardLast4: row.card_last_4 || '',
    isCheckedIn: row.is_checked_in,
    mobile: row.mobile,
    email: row.email || '',
    goal: row.goal || '',
    homeClub: row.home_club || '',
    coach: row.coach || '',
    joined: row.created_at?.slice(0, 10) || '',
    emergencyContact: row.emergency_contact || '',
  };
}

/** Fetch the current user's own member profile */
export async function getMyProfile(): Promise<MemberProfile | null> {
  if (!isSupabaseConfigured) {
    return StorageService.get<MemberProfile>('apex_member', INITIAL_MEMBERS[0]);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !data) return null;
  return dbToMember(data as DbMember);
}

/** Fetch all members (staff/manager view) */
export async function getAllMembers(): Promise<MemberProfile[]> {
  if (!isSupabaseConfigured) {
    return StorageService.get<MemberProfile[]>('apex_members', INITIAL_MEMBERS);
  }

  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as DbMember[]).map(dbToMember);
}

/** Update the current user's own profile */
export async function updateMyProfile(updates: Partial<MemberProfile>): Promise<MemberProfile | null> {
  if (!isSupabaseConfigured) {
    const current = await StorageService.get<MemberProfile>('apex_member', INITIAL_MEMBERS[0]);
    const updated = { ...current, ...updates };
    await StorageService.set('apex_member', updated);
    return updated;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUpdates: Partial<DbMember> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.goal !== undefined) dbUpdates.goal = updates.goal;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.emergencyContact !== undefined) dbUpdates.emergency_contact = updates.emergencyContact;

  const { data, error } = await supabase
    .from('members')
    .update(dbUpdates)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (error || !data) return null;
  return dbToMember(data as DbMember);
}

/** Toggle a member's status (staff/manager action) */
export async function toggleMemberStatus(memberId: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const members = await StorageService.get<MemberProfile[]>('apex_members', INITIAL_MEMBERS);
    const updated = members.map((m) =>
      m.id === memberId
        ? { ...m, status: (m.status === 'Active' ? 'Payment Due' : 'Active') as MemberProfile['status'] }
        : m
    );
    await StorageService.set('apex_members', updated);
    return true;
  }

  // Fetch current status
  const { data: member } = await supabase
    .from('members')
    .select('status')
    .eq('id', memberId)
    .single();

  if (!member) return false;

  const newStatus = member.status === 'Active' ? 'Payment Due' : 'Active';

  const { error } = await supabase
    .from('members')
    .update({ status: newStatus })
    .eq('id', memberId);

  return !error;
}
