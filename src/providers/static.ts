import type { Currency } from '@/core/money';
import type { RateWithMeta } from './types';

/**
 * Mapa de taxa para BRL como base (exemplo).
 */
const RATE_TO_BRL: Record<Currency, number> = {
  BRL: 1,
  USD: 0.18419,
  EUR: 0.1576,
};

function crossRate(from: Currency, to: Currency): string {
  if (from === to) return '1';
  const toBRL = RATE_TO_BRL[to];
  const fromBRL = RATE_TO_BRL[from];
  if (!toBRL || !fromBRL) throw new Error('Unsupported currency');
  return String(toBRL / fromBRL);
}

export const StaticRateProvider = {
  getRate(from: Currency, to: Currency): RateWithMeta {
    // provider/attributionUrl são opcionais; no estático deixamos indefinidos
    return { from, to, value: crossRate(from, to) };
  },
};
