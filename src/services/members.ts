import { apiFetch } from './apiClient';
import { StorageService } from './storage';
import type { MemberProfile } from '../types';
import { INITIAL_MEMBERS } from '../constants/initialData';

export async function getMyProfile(): Promise<MemberProfile | null> {
  try {
    const data = await apiFetch<MemberProfile>('/members/me');
    return data;
  } catch {
    return StorageService.get<MemberProfile>('apex_member', INITIAL_MEMBERS[0]);
  }
}

export async function getAllMembers(): Promise<MemberProfile[]> {
  try {
    const data = await apiFetch<MemberProfile[]>('/members');
    return data;
  } catch {
    return StorageService.get<MemberProfile[]>('apex_members', INITIAL_MEMBERS);
  }
}

export async function updateMyProfile(updates: Partial<MemberProfile>): Promise<MemberProfile | null> {
  try {
    const res = await apiFetch<{ success: boolean; member: MemberProfile }>('/members/me', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return res.member;
  } catch {
    const current = await StorageService.get<MemberProfile>('apex_member', INITIAL_MEMBERS[0]);
    const updated = { ...current, ...updates };
    await StorageService.set('apex_member', updated);
    return updated;
  }
}

export async function toggleMemberStatus(memberId: string): Promise<boolean> {
  try {
    const res = await apiFetch<{ success: boolean; newStatus: string }>(`/members/${memberId}/toggle-status`, {
      method: 'POST'
    });
    return res.success;
  } catch {
    const members = await StorageService.get<MemberProfile[]>('apex_members', INITIAL_MEMBERS);
    const updated = members.map((m) =>
      m.id === memberId
        ? { ...m, status: (m.status === 'Active' ? 'Payment Due' : 'Active') as MemberProfile['status'] }
        : m
    );
    await StorageService.set('apex_members', updated);
    return true;
  }
}

export async function enrollMember(data: {
  name: string;
  mobile: string;
  email?: string;
  tier?: string;
  goal?: string;
  emergencyContact?: string;
  status?: 'Active' | 'Payment Due';
}): Promise<{ success: boolean; member?: MemberProfile; error?: string }> {
  try {
    const res = await apiFetch<{ success: boolean; member: MemberProfile }>('/members', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return { success: res.success, member: res.member };
  } catch (err: any) {
    const cleanPhone = data.mobile.replace(/\s+/g, '');
    const memberTag = `APX-${Math.floor(2000 + Math.random() * 7900)}`;
    const newMember: MemberProfile = {
      id: `mem-${Date.now()}`,
      memberId: memberTag,
      name: data.name.trim(),
      tier: data.tier || 'Annual Pro',
      status: data.status || 'Active',
      streakDays: 0,
      nextRenewal: 'Dec 01, 2026',
      cardLast4: '1024',
      isCheckedIn: false,
      mobile: `+91 ${cleanPhone}`,
      email: data.email || '',
      goal: data.goal || 'General Fitness',
      homeClub: 'Park Street Flagship',
      coach: 'Karan Singh',
      joined: new Date().toISOString().slice(0, 10),
      emergencyContact: data.emergencyContact || ''
    };
    const members = await StorageService.get<MemberProfile[]>('apex_members', INITIAL_MEMBERS);
    await StorageService.set('apex_members', [newMember, ...members]);
    return { success: true, member: newMember };
  }
}
