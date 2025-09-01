import { env } from '@/env/server';
import type { Currency } from '@/core/money';

export type RatePoint = { date: string; value: number };
export type SeriesMeta = { provider: 'yahoo' | 'frankfurter'; granularity: 'intraday' | 'daily' };

/* Tipos mínimos para a resposta do Yahoo Finance (chart API) */
type YahooQuote = { close?: Array<number | null> };
type YahooIndicators = { quote?: YahooQuote[] };
type YahooResult = { timestamp?: number[]; indicators?: YahooIndicators };
type YahooChartResponse = { chart?: { result?: YahooResult[] } };

// Helpers de narrowing
function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}
function hasProp<K extends PropertyKey>(o: unknown, k: K): o is Record<K, unknown> {
  return isObject(o) && k in o;
}

function isYahooChartResponse(x: unknown): x is YahooChartResponse {
  if (!hasProp(x, 'chart')) return false;
  const chart = x.chart; // chart: unknown
  if (!hasProp(chart, 'result')) return false;
  const result = chart.result; // result: unknown
  if (!Array.isArray(result) || !result.length) return false;
  return true;
}

function formatDateUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = `${d.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${d.getUTCDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function addDaysUTC(d: Date, days: number): Date {
  const copy = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}
async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>, ms = 4000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fn(ctrl.signal);
  } finally {
    clearTimeout(id);
  }
}

function yahooSymbol(from: Currency, to: Currency): { symbol: string; invert: boolean } {
  const CRYPTO = new Set<Currency>(['BTC', 'ETH', 'USDT']);

  // Caso envolva cripto: usamos padrão "CRYPTO-FIAT"
  if (CRYPTO.has(from) || CRYPTO.has(to)) {
    const crypto = CRYPTO.has(from) ? from : to;
    const fiat = CRYPTO.has(from) ? to : from;
    return { symbol: `${crypto}-${fiat}`, invert: CRYPTO.has(to) }; // invert quando TO é cripto
  }

  // Forex tradicional
  const map: Record<string, { symbol: string; invert: boolean }> = {
    'USD->BRL': { symbol: 'USDBRL=X', invert: false },
    'BRL->USD': { symbol: 'USDBRL=X', invert: true },
    'EUR->BRL': { symbol: 'EURBRL=X', invert: false },
    'BRL->EUR': { symbol: 'EURBRL=X', invert: true },
    'EUR->USD': { symbol: 'EURUSD=X', invert: false },
    'USD->EUR': { symbol: 'EURUSD=X', invert: true },

    'USD->GBP': { symbol: 'USDGBP=X', invert: false }, // Yahoo aceita várias formas; fallback genérico abaixo cobre
    'GBP->USD': { symbol: 'USDGBP=X', invert: true },
    'USD->JPY': { symbol: 'USDJPY=X', invert: false },
    'JPY->USD': { symbol: 'USDJPY=X', invert: true },
    'USD->CAD': { symbol: 'USDCAD=X', invert: false },
    'CAD->USD': { symbol: 'USDCAD=X', invert: true },
    'USD->AUD': { symbol: 'USDAUD=X', invert: false },
    'AUD->USD': { symbol: 'USDAUD=X', invert: true },
    'USD->CHF': { symbol: 'USDCHF=X', invert: false },
    'CHF->USD': { symbol: 'USDCHF=X', invert: true },
    'EUR->GBP': { symbol: 'EURGBP=X', invert: false },
    'GBP->EUR': { symbol: 'EURGBP=X', invert: true },
  };
  const key = `${from}->${to}`;
  if (map[key]) return map[key];

  // fallback genérico para pares forex
  return { symbol: `${from}${to}=X`, invert: false };
}

/** Série intraday do Yahoo (sem chave) */
async function yahooIntraday(
  from: Currency,
  to: Currency,
  days: number,
  signal?: AbortSignal
): Promise<{ points: RatePoint[] }> {
  const { symbol, invert } = yahooSymbol(from, to);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?range=${Math.max(1, days)}d&interval=60m`;

  const res = await fetch(url, { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`);

  const json: unknown = await res.json();
  if (!isYahooChartResponse(json)) throw new Error('Yahoo: unexpected shape');

  const result = json.chart!.result![0];
  const ts = result.timestamp ?? [];
  const closes = result.indicators?.quote?.[0]?.close ?? [];

  if (!Array.isArray(ts) || !Array.isArray(closes) || ts.length !== closes.length) {
    throw new Error('Yahoo: invalid series');
  }

  const points: RatePoint[] = [];
  for (let i = 0; i < ts.length; i++) {
    const v = closes[i];
    if (v == null || !Number.isFinite(v)) continue;
    const val = invert ? 1 / Number(v) : Number(v);
    const date = new Date(ts[i] * 1000).toISOString().slice(0, 16).replace('T', ' ');
    points.push({ date, value: val });
  }
  if (!points.length) throw new Error('Yahoo: empty');
  return { points };
}

/** Série diária do Frankfurter (ECB) — apenas dias úteis */
async function frankfurterDaily(
  from: Currency,
  to: Currency,
  days: number,
  signal?: AbortSignal
): Promise<{ points: RatePoint[] }> {
  const end = new Date();
  const start = addDaysUTC(end, -(Math.max(1, days) - 1));
  const base = env.FRANKFURTER_BASE;
  const url = `${base}/${formatDateUTC(start)}..${formatDateUTC(end)}?from=${from}&to=${to}`;

  const res = await fetch(url, { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`Frankfurter timeseries HTTP ${res.status}`);

  const data = (await res.json()) as { rates?: Record<string, Record<string, number>> };
  const rates = data.rates ?? {};
  const points = Object.keys(rates)
    .sort()
    .map((date) => ({ date, value: Number(rates[date]?.[to]) }))
    .filter((p) => Number.isFinite(p.value));

  if (!points.length) throw new Error('Frankfurter: empty');
  return { points };
}

export async function getSeriesWithFallback(
  from: Currency,
  to: Currency,
  days = 7,
  timeoutMs = 4000
): Promise<{ points: RatePoint[]; meta: SeriesMeta }> {
  try {
    const { points } = await withTimeout((signal) => yahooIntraday(from, to, days, signal), timeoutMs);
    return { points, meta: { provider: 'yahoo', granularity: 'intraday' } };
  } catch {
    // fallback
  }
  const { points } = await withTimeout((signal) => frankfurterDaily(from, to, days, signal), timeoutMs);
  return { points, meta: { provider: 'frankfurter', granularity: 'daily' } };
}
