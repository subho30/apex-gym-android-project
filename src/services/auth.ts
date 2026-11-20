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

export async function sendOtp(
  phone: string,
  purpose: 'login' | 'signup' = 'login'
): Promise<{ success: boolean; code?: string; notRegistered?: boolean; error?: string }> {
  try {
    const res = await apiFetch<{ success: boolean; message?: string; code?: string }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, purpose })
    });
    return { success: res.success, code: res.code };
  } catch (err: any) {
    const message = err?.message || 'Failed to dispatch verification code';
    const notRegistered = message.toLowerCase().includes('no active membership') || message.toLowerCase().includes('not found') || message.toLowerCase().includes('register');
    return {
      success: false,
      notRegistered,
      error: message
    };
  }
}

export async function verifyOtp(
  phone: string,
  otpCode: string
): Promise<{ success: boolean; session?: AuthSession; notRegistered?: boolean; error?: string }> {
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
    const message = err?.message || 'Verification failed. Please check code.';
    const notRegistered = message.toLowerCase().includes('no active account') || message.toLowerCase().includes('register');
    return {
      success: false,
      notRegistered,
      error: message
    };
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
