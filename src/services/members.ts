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
