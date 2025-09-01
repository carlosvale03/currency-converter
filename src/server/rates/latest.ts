// src/server/rates/latest.ts
import 'server-only';
import { env } from '@/env/server';
import { type Currency, CRYPTO_CURRENCIES } from '@/core/money';

export type RateWithMeta = {
  value: number;
  provider: 'frankfurter' | 'open-er-api' | 'currency-api';
  attributionUrl?: string | null;
};

function isCrypto(c: Currency) {
  return (CRYPTO_CURRENCIES as readonly string[]).includes(c);
}

async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>, ms = 4500): Promise<T> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fn(ctrl.signal);
  } finally {
    clearTimeout(id);
  }
}

/* ---------- FRANKFURTER (FIAT apenas) ---------- */
async function getFrankfurter(from: Currency, to: Currency, signal?: AbortSignal): Promise<RateWithMeta> {
  const base = env.FRANKFURTER_BASE; // ex: https://api.frankfurter.dev/v1
  const url = `${base}/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  const res = await fetch(url, { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`Frankfurter HTTP ${res.status}`);
  const json: unknown = await res.json();
  const rate = (json as { rates?: Record<string, number> })?.rates?.[to];
  if (!Number.isFinite(rate)) throw new Error('Frankfurter: missing rate');
  return { value: Number(rate), provider: 'frankfurter', attributionUrl: null };
}

/* ---------- OPEN ER-API (FIAT) ---------- */
async function getOpenER(from: Currency, to: Currency, signal?: AbortSignal): Promise<RateWithMeta> {
  const base = env.OPEN_ER_API_BASE; // ex: https://open.er-api.com/v6
  const url = `${base}/latest/${encodeURIComponent(from)}`;
  const res = await fetch(url, { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`Open ER-API HTTP ${res.status}`);
  const json: unknown = await res.json();

  const dict =
    (json as { rates?: Record<string, number> })?.rates ??
    (json as { conversion_rates?: Record<string, number> })?.conversion_rates;

  const rate = dict?.[to];
  if (!Number.isFinite(rate)) throw new Error('Open ER-API: missing rate');
  return {
    value: Number(rate),
    provider: 'open-er-api',
    attributionUrl: 'https://www.exchangerate-api.com',
  };
}

/* ---------- CURRENCY-API (CDN) — FIAT e CRYPTO ---------- */
async function parseCurrencyApiPair(
  from: string,
  to: string,
  json: unknown
): Promise<number | null> {
  // A) { date, [to]: number }  B) { date, [from]: { [to]: number } }
  if (json && typeof json === 'object') {
    const obj = json as Record<string, unknown>;
    const flat = obj[to];
    if (typeof flat === 'number') return flat;
    const nested = obj[from];
    if (nested && typeof nested === 'object') {
      const val = (nested as Record<string, unknown>)[to];
      if (typeof val === 'number') return val;
    }
  }
  return null;
}

async function getCurrencyApi(from: Currency, to: Currency, signal?: AbortSignal): Promise<RateWithMeta> {
  // Bases em ordem de preferência (1: npm – novo; 2: gh – legado)
  const bases = [
    env.CURRENCY_API_CDN_BASE?.replace(/\/+$/, ''),
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies',
    'https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies',
  ].filter(Boolean) as string[];

  const f = from.toLowerCase();
  const t = to.toLowerCase();

  // tenta cada base até obter um rate válido
  for (const base of bases) {
    // 1) endpoint do par: .../f/t.json
    try {
      const pairUrl = `${base}/${encodeURIComponent(f)}/${encodeURIComponent(t)}.json`;
      const r1 = await fetch(pairUrl, { signal, cache: 'no-store' });
      if (r1.ok) {
        const j1: unknown = await r1.json();
        const rate1 = await parseCurrencyApiPair(f, t, j1);
        if (Number.isFinite(rate1)) {
          return { value: Number(rate1), provider: 'currency-api', attributionUrl: null };
        }
      }
    } catch {
      // segue para tentativa 2
    }

    // 2) endpoint do "from": .../f.json  (mapa completo)
    try {
      const mapUrl = `${base}/${encodeURIComponent(f)}.json`;
      const r2 = await fetch(mapUrl, { signal, cache: 'no-store' });
      if (r2.ok) {
        const j2: unknown = await r2.json();
        const dict = (j2 as Record<string, unknown>)[f];
        const rate2 = dict && typeof dict === 'object' ? (dict as Record<string, unknown>)[t] : undefined;
        if (Number.isFinite(rate2 as number)) {
          return { value: Number(rate2), provider: 'currency-api', attributionUrl: null };
        }
      }
    } catch {
      // tenta próxima base
    }
  }

  throw new Error('Currency-API: missing rate (all bases)');
}


/* ---------- API pública do servidor ---------- */
export async function getLatestRateWithFallback(
  from: Currency,
  to: Currency,
  abortSignal?: AbortSignal
): Promise<RateWithMeta> {
  if (from === to) return { value: 1, provider: 'frankfurter', attributionUrl: null };

  const hasCrypto = isCrypto(from) || isCrypto(to);

  if (hasCrypto) {
    // Somente Currency-API atende cripto sem chave
    return withTimeout((signal) => getCurrencyApi(from, to, abortSignal ?? signal));
  }

  try {
    return await withTimeout((signal) => getFrankfurter(from, to, abortSignal ?? signal));
  } catch {}
  try {
    return await withTimeout((signal) => getOpenER(from, to, abortSignal ?? signal));
  } catch {}
  return withTimeout((signal) => getCurrencyApi(from, to, abortSignal ?? signal));
}
