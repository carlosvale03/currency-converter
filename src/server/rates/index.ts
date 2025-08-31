import type { Currency } from '@/core/money';
import { env } from '@/env/server'; // <- NEW

type ProviderId = 'frankfurter' | 'open-er-api' | 'currency-api';

export type FallbackResult = {
  value: number;
  provider: ProviderId;
  attributionUrl?: string;
};

function isFiniteNumber(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x);
}

async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  ms = 3000
): Promise<T> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fn(ctrl.signal);
  } finally {
    clearTimeout(id);
  }
}

async function frankfurter(from: Currency, to: Currency, signal?: AbortSignal) {
  const base = env.FRANKFURTER_BASE; // <- usando env validado
  const url = `${base}/latest?base=${from}&symbols=${to}`;
  const res = await fetch(url, { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`Frankfurter HTTP ${res.status}`);
  const data = await res.json();
  const v = data?.rates?.[to];
  if (!isFiniteNumber(v)) throw new Error('Frankfurter: missing rate');
  return v as number;
}

async function openErApi(from: Currency, to: Currency, signal?: AbortSignal) {
  const base = env.OPEN_ER_API_BASE; // <- usando env validado
  const url = `${base}/latest/${from}`;
  const res = await fetch(url, { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`Open ER-API HTTP ${res.status}`);
  const data = await res.json();
  const v = data?.rates?.[to];
  if (!isFiniteNumber(v)) throw new Error('Open ER-API: missing rate');
  return v as number;
}

async function currencyApiCdn(from: Currency, to: Currency, signal?: AbortSignal) {
  const base = env.CURRENCY_API_CDN_BASE; // <- usando env validado
  const url = `${base}/${from.toLowerCase()}/${to.toLowerCase()}.json`;
  const res = await fetch(url, { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`Currency-API CDN HTTP ${res.status}`);
  const data = await res.json();
  const v = data?.[to.toLowerCase()];
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error('Currency-API CDN: missing rate');
  return n;
}

export async function getRateWithFallback(
  from: Currency,
  to: Currency,
  timeoutMs = 3000
) {
  const chain: Array<{
    id: ProviderId;
    run: (signal: AbortSignal) => Promise<number>;
    attributionUrl?: string;
  }> = [
    { id: 'frankfurter', run: (signal) => frankfurter(from, to, signal) },
    {
      id: 'open-er-api',
      run: (signal) => openErApi(from, to, signal),
      attributionUrl: 'https://www.exchangerate-api.com',
    },
    { id: 'currency-api', run: (signal) => currencyApiCdn(from, to, signal) },
  ];

  let lastErr: unknown = null;
  for (const p of chain) {
    try {
      const value = await withTimeout(p.run, timeoutMs);
      return { value, provider: p.id, attributionUrl: p.attributionUrl };
    } catch (err) {
      lastErr = err;
      continue;
    }
  }
  throw lastErr ?? new Error('All providers failed');
}