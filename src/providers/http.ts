'use client';

import type { Currency } from '@/core/money';

export type RateWithMeta = {
  value: number;
  provider: 'frankfurter' | 'open-er-api' | 'currency-api';
  attributionUrl?: string | null;
};

export const HttpRateProvider = {
  async getRate(from: Currency, to: Currency, signal?: AbortSignal): Promise<RateWithMeta> {
    const url = `/api/rate?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const res = await fetch(url, { signal, cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`rate http ${res.status}`);
    }
    const json = (await res.json()) as RateWithMeta;
    if (!Number.isFinite(json.value)) throw new Error('rate invalid');
    return json;
  },
};