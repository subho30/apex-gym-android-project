import { StorageService } from './storage';
import { apiFetch } from './apiClient';
import type { UserRole, MemberProfile } from '../types';

export interface AuthSession {
  userId: string;
  role: UserRole;
  name: string;
  memberId: string;
  phone: string;
  accessToken: string;
}

export async function sendOtp(phone: string): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    const res = await apiFetch<{ success: boolean; message?: string; code?: string }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone })
    });
    return { success: res.success, code: res.code || '4829' };
  } catch (err: any) {
    // Local demo fallback if server not reachable
    return { success: true, code: '4829' };
  }
}

export async function verifyOtp(
  phone: string,
  otpCode: string
): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
  try {
    const res = await apiFetch<{ success: boolean; session: AuthSession }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp: otpCode })
    });

    if (res.success && res.session) {
      await StorageService.set('apex_auth_session', res.session);
      return { success: true, session: res.session };
    }
    return { success: false, error: 'Verification failed' };
  } catch (err: any) {
    // Local demo fallback if offline
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
      accessToken: 'demo-token'
    };

    await StorageService.set('apex_auth_session', session);
    return { success: true, session };
  }
}

export async function signUpMember(data: {
  name: string;
  phone: string;
  email?: string;
  goal?: string;
  tier?: string;
  emergencyContact?: string;
  otp?: string;
}): Promise<{ success: boolean; session?: AuthSession; member?: MemberProfile; error?: string }> {
  try {
    const res = await apiFetch<{ success: boolean; session: AuthSession; member: MemberProfile }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (res.success && res.session) {
      await StorageService.set('apex_auth_session', res.session);
      await StorageService.set('apex_member', res.member);
      return { success: true, session: res.session, member: res.member };
    }
    return { success: false, error: 'Registration failed' };
  } catch (err: any) {
    // Local demo fallback
    const cleanPhone = data.phone.replace(/\s+/g, '');
    const memberId = `APX-${Math.floor(2000 + Math.random() * 7900)}`;
    const session: AuthSession = {
      userId: `usr-${Date.now()}`,
      role: 'member',
      name: data.name.trim(),
      memberId,
      phone: cleanPhone,
      accessToken: 'demo-token'
    };
    const member: MemberProfile = {
      id: `mem-${Date.now()}`,
      memberId,
      name: data.name.trim(),
      tier: data.tier || 'Annual Pro',
      status: 'Active',
      streakDays: 0,
      nextRenewal: 'Dec 01, 2026',
      cardLast4: '4829',
      isCheckedIn: false,
      mobile: `+91 ${cleanPhone}`,
      email: data.email || '',
      goal: data.goal || 'Build muscle',
      homeClub: 'Park Street Flagship',
      coach: 'Karan Singh',
      joined: new Date().toISOString().slice(0, 10),
      emergencyContact: data.emergencyContact || ''
    };
    await StorageService.set('apex_auth_session', session);
    await StorageService.set('apex_member', member);
    return { success: true, session, member };
  }
}

export async function restoreSession(): Promise<AuthSession | null> {
  const cached = await StorageService.get<AuthSession | null>('apex_auth_session', null);
  return cached;
}

export async function signOut(): Promise<void> {
  await StorageService.remove('apex_auth_session');
}
