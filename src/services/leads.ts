import { supabase, isSupabaseConfigured, edgeFunctionUrl } from './supabase';
import { StorageService } from './storage';
import type { LeadItem } from '../types';
import { INITIAL_LEADS } from '../constants/initialData';

/** Fetch all leads (staff/manager view) */
export async function getLeads(): Promise<LeadItem[]> {
  if (!isSupabaseConfigured) {
    return StorageService.get<LeadItem[]>('apex_leads', INITIAL_LEADS);
  }

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    source: row.source,
    status: row.status,
    submitted: formatRelativeTime(row.created_at),
  }));
}

/** Submit a lead (public — no auth required) */
export async function submitLead(lead: {
  name: string;
  phone: string;
  email?: string;
  source?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  if (!isSupabaseConfigured) {
    const leads = await StorageService.get<LeadItem[]>('apex_leads', INITIAL_LEADS);
    const newLead: LeadItem = {
      id: `ld-${Date.now()}`,
      name: lead.name,
      phone: lead.phone,
      source: lead.source || 'Landing Page',
      status: 'New Lead',
      submitted: 'Just now',
    };
    await StorageService.set('apex_leads', [newLead, ...leads]);
    return {
      success: true,
      message: 'Thanks for your interest! Our team will reach out within 2 hours.',
    };
  }

  try {
    const res = await fetch(edgeFunctionUrl('submit-lead'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    });

    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'Submission failed' };
    return { success: true, message: data.message };
  } catch (err) {
    return { success: false, error: 'Network error. Please try again.' };
  }
}

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}
