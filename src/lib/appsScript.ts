import { OrderItem } from '../types';

export interface NormalizedOrderPayload {
  customerName: string;
  customerNumber: string;
  address: string;
  warehouse: string;
  rawText: string;
  items: OrderItem[];
  deposits: { blow: string; pallet: string };
}

export async function postOrderToAppsScript(endpoint: string, payload: NormalizedOrderPayload) {
  const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'createOrder', ...payload }) });
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.ok === false) throw new Error(data?.error || 'שגיאה בשליחה ל-Apps Script');
  return data;
}
