import { apiFetch } from './apiClient';
import type { InvoiceItem } from '../types';

export async function getInvoices(): Promise<InvoiceItem[]> {
  try {
    const data = await apiFetch<InvoiceItem[]>('/invoices');
    return data;
  } catch (err) {
    console.warn('[Invoices] Failed to load invoices:', err);
    return [];
  }
}
