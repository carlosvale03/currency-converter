import type { Currency, Rate } from '@/core/money';

/**
 * Usa exchangerate.host (gratuita) como exemplo.
 * Pode trocar via env: NEXT_PUBLIC_RATE_API_BASE
 */
const API_BASE = process.env.NEXT_PUBLIC_RATE_API_BASE ?? 'https://api.exchangerate.host';

async function fetchRate(from: Currency, to: Currency, signal?: AbortSignal): Promise<Rate> {
  const url = `${API_BASE}/latest?base=${from}&symbols=${to}`;
  const res = await fetch(url, { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const value = data?.rates?.[to];
  if (!value) throw new Error('Invalid API response');
  return { from, to, value: String(value) };
}

export const HttpRateProvider = {
  async getRate(from: Currency, to: Currency, signal?: AbortSignal): Promise<Rate> {
    return fetchRate(from, to, signal);
  },
};
