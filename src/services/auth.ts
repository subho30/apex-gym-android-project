import { supabase, isSupabaseConfigured } from './supabase';
import { StorageService } from './storage';
import type { UserRole } from '../types';

export interface AuthSession {
  userId: string;
  role: UserRole;
  name: string;
  memberId: string;
  phone: string;
  accessToken: string;
}

// ─── Supabase Phone OTP Auth ───────────────────────────────────────────────

/**
 * Step 1: Send OTP to the given phone number.
 * In demo/offline mode, always succeeds immediately.
 */
export async function sendOtp(phone: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true }; // offline demo mode
  }

  // Supabase expects E.164 format: +91XXXXXXXXXX
  const e164 = phone.startsWith('+') ? phone : `+91${phone.replace(/\s+/g, '')}`;

  const { error } = await supabase.auth.signInWithOtp({ phone: e164 });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Step 2: Verify the OTP code and establish a session.
 * Returns the user's role and member profile info.
 */
export async function verifyOtp(
  phone: string,
  otpCode: string
): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
  if (!isSupabaseConfigured) {
    // Offline demo: accept "1234" as the code
    if (otpCode !== '1234') {
      return { success: false, error: 'Incorrect code. Demo code is 1234.' };
    }

    // Map demo phone numbers to roles
    const cleanPhone = phone.replace(/\s+/g, '');
    let role: UserRole = 'member';
    let name = 'Rohan Sharma';
    let memberId = 'APX-2041';

    if (cleanPhone.endsWith('10002')) {
      role = 'staff';
      name = 'Meera Joshi (Front Desk)';
      memberId = 'STAFF-102';
    } else if (cleanPhone.endsWith('10003')) {
      role = 'manager';
      name = 'Anita Das (General Manager)';
      memberId = 'MGR-001';
    }

    const session: AuthSession = {
      userId: `demo-${role}`,
      role,
      name,
      memberId,
      phone: cleanPhone,
      accessToken: 'demo-token',
    };

    await StorageService.set('apex_auth_session', session);
    return { success: true, session };
  }

  // Supabase OTP verification
  const e164 = phone.startsWith('+') ? phone : `+91${phone.replace(/\s+/g, '')}`;
  const { data, error } = await supabase.auth.verifyOtp({
    phone: e164,
    token: otpCode,
    type: 'sms',
  });

  if (error || !data.session) {
    return { success: false, error: error?.message || 'Verification failed' };
  }

  const userId = data.session.user.id;

  // Fetch the user's role
  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  const role: UserRole = (roleRow?.role as UserRole) || 'member';

  // Fetch (or create) the member profile
  let { data: member } = await supabase
    .from('members')
    .select('member_id, name')
    .eq('user_id', userId)
    .single();

  if (!member) {
    // First login: create a member profile
    const newMemberId = `APX-${Math.floor(1000 + Math.random() * 9000)}`;
    const displayName = data.session.user.phone || 'New Member';

    const { data: created } = await supabase
      .from('members')
      .insert({
        user_id: userId,
        member_id: newMemberId,
        name: displayName,
        mobile: e164,
        tier: 'Monthly Pro',
        status: 'Active',
      })
      .select('member_id, name')
      .single();

    member = created;

    // Also create the user_roles entry if missing
    if (!roleRow) {
      await supabase.from('user_roles').insert({ user_id: userId, role: 'member' });
    }
  }

  const session: AuthSession = {
    userId,
    role,
    name: member?.name || 'Member',
    memberId: member?.member_id || 'APX-0000',
    phone: e164,
    accessToken: data.session.access_token,
  };

  await StorageService.set('apex_auth_session', session);
  return { success: true, session };
}

/**
 * Restore a previously persisted session on app launch.
 */
export async function restoreSession(): Promise<AuthSession | null> {
  if (isSupabaseConfigured) {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      // Session exists in Supabase, restore from local cache for role info
      const cached = await StorageService.get<AuthSession | null>('apex_auth_session', null);
      if (cached && cached.userId === data.session.user.id) {
        return { ...cached, accessToken: data.session.access_token };
      }
      // Cache missing or stale — refetch role
      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.session.user.id)
        .single();

      const { data: member } = await supabase
        .from('members')
        .select('member_id, name')
        .eq('user_id', data.session.user.id)
        .single();

      const session: AuthSession = {
        userId: data.session.user.id,
        role: (roleRow?.role as UserRole) || 'member',
        name: member?.name || 'Member',
        memberId: member?.member_id || 'APX-0000',
        phone: data.session.user.phone || '',
        accessToken: data.session.access_token,
      };
      await StorageService.set('apex_auth_session', session);
      return session;
    }
  }

  // Fallback to locally persisted session (demo/offline mode)
  return StorageService.get<AuthSession | null>('apex_auth_session', null);
}

/**
 * Sign out and clear all session data.
 */
export async function signOut(): Promise<void> {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
  await StorageService.remove('apex_auth_session');
}
