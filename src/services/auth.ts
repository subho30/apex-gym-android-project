import { StorageService } from './storage';
import { apiFetch } from './apiClient';
import type { UserRole } from '../types';

export interface AuthSession {
  userId: string;
  role: UserRole;
  name: string;
  memberId: string;
  phone: string;
  accessToken: string;
}

export async function sendOtp(phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone })
    });
    return { success: res.success };
  } catch (err: any) {
    // Local demo fallback if server not reachable
    return { success: true };
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
    // Local demo fallback if offline / server not running
    if (otpCode !== '1234') {
      return { success: false, error: 'Incorrect code. Demo code is 1234.' };
    }

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

export async function restoreSession(): Promise<AuthSession | null> {
  const cached = await StorageService.get<AuthSession | null>('apex_auth_session', null);
  return cached;
}

export async function signOut(): Promise<void> {
  await StorageService.remove('apex_auth_session');
}
