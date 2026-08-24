import type { OrderItem } from '../types';

export interface NormalizedOrderPayload {
  customerName: string;
  customerNumber?: string;
  address: string;
  warehouse: string;
  rawText?: string;
  items: OrderItem[];
  deposits: { blow: string; pallet: string };
}

export const SABANOS_API_URL = 'https://script.google.com/macros/s/AKfycbypqWo3-ME_kCdKbeny1TJLkOBcPqj8YqT5c8B6HAK31Bc7y4_-tapXS1UvSXfIsjoy/exec';

type ApiEnvelope<T> = T & { error?: string; ok?: boolean };

async function post<T>(payload: Record<string, unknown>): Promise<T> {
  const response = await fetch(SABANOS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null) as ApiEnvelope<T> | null;
  if (!response.ok) throw new Error(data?.error || `SabanOS API error (${response.status})`);
  if (!data) throw new Error('SabanOS API החזיר תשובה לא תקינה');
  if (data.ok === false || data.error) throw new Error(data.error || 'SabanOS API request failed');
  return data;
}

export interface NormalizeResponse {
  data: {
    customerName: string;
    items: Array<Record<string, unknown>>;
    crossSellSuggestions: Array<Record<string, unknown>>;
    rawAnalysisExplanation: string;
  };
}

export function normalizeRawOrder(rawMessage: string, customerName: string): Promise<NormalizeResponse> {
  return post<NormalizeResponse>({ action: 'normalize', rawMessage, customerName });
}

export interface LearnResponse {
  message: string;
  dictionary?: unknown[];
}

export function learnSlangTerm(sku: string, slangTerm: string): Promise<LearnResponse> {
  return post<LearnResponse>({ action: 'learn', sku, slangTerm });
}

export interface SubmitOrderResponse {
  order: Record<string, unknown>;
}

export function submitOrder(payload: NormalizedOrderPayload): Promise<SubmitOrderResponse> {
  const { customerNumber: _customerNumber, rawText: _rawText, deposits, address, ...order } = payload;
  return post<SubmitOrderResponse>({
    action: 'submit',
    ...order,
    deliveryAddress: address,
    depositsSummary: {
      balas: Number.parseInt(deposits.blow, 10) || 0,
      pallets: Number.parseInt(deposits.pallet, 10) || 0,
      notes: `${deposits.pallet}, ${deposits.blow}`,
    },
  });
}
