import type { Currency } from '@/core/money';
import type { RateWithMeta } from './types';

export const HttpRateProvider = {
  async getRate(from: Currency, to: Currency, signal?: AbortSignal): Promise<RateWithMeta> {
    const res = await fetch(`/api/rate?from=${from}&to=${to}`, {
      signal,
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      from,
      to,
      value: String(data.rate),
      provider: data.provider ?? undefined,
      attributionUrl: data.attributionUrl ?? null,
    };
  },
};
