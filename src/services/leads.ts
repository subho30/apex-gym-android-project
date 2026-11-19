import { apiFetch } from './apiClient';
import { StorageService } from './storage';
import type { LeadItem } from '../types';
import { INITIAL_LEADS } from '../constants/initialData';

export async function getLeads(): Promise<LeadItem[]> {
  try {
    const data = await apiFetch<LeadItem[]>('/leads');
    return data;
  } catch {
    return StorageService.get<LeadItem[]>('apex_leads', INITIAL_LEADS);
  }
}

export async function submitLead(lead: {
  name: string;
  phone: string;
  source?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/leads', {
      method: 'POST',
      body: JSON.stringify(lead)
    });
    return res;
  } catch {
    const leads = await StorageService.get<LeadItem[]>('apex_leads', INITIAL_LEADS);
    const newLead: LeadItem = {
      id: `ld-${Date.now()}`,
      name: lead.name,
      phone: lead.phone,
      source: lead.source || 'Landing Page',
      status: 'New Lead',
      submitted: 'Just now'
    };
    await StorageService.set('apex_leads', [newLead, ...leads]);
    return {
      success: true,
      message: 'Thanks for your interest! Our team will reach out within 2 hours.'
    };
  }
}
