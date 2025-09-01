import type { Currency } from '@/core/money';
import type { RateWithMeta } from './types';

/**
 * Fallback estático: unidades POR 1 USD (aprox. para cripto).
 * Ex.: BRL: 5.40 => 1 USD = 5.40 BRL
 */

const USD_BASE_FIAT = {
  USD: 1,
  EUR: 0.92,
  BRL: 5.40,
  GBP: 0.78,
  JPY: 157,
  CAD: 1.36,
  AUD: 1.48,
  CHF: 0.86,
} as const;

const USD_BASE_CRYPTO = {
  BTC: 1 / 65000,
  ETH: 1 / 3000,
  USDT: 1,
} as const;

// Se seu tipo Currency inclui todas acima, este cast é seguro p/ map unificado
const USD_BASE: Record<Currency, number> = {
  ...(USD_BASE_FIAT as Record<string, number>),
  ...(USD_BASE_CRYPTO as Record<string, number>),
} as unknown as Record<Currency, number>;

// (opcional) manter alias para compatibilidade com imports antigos
export type StaticRate = RateWithMeta;

export const StaticRateProvider = {
  /**
   * rate(from→to) = USD_BASE[to] / USD_BASE[from]
   */
  getRate(from: Currency, to: Currency): RateWithMeta {
    if (from === to) return { value: 1, provider: 'static', attributionUrl: null };
    const f = USD_BASE[from];
    const t = USD_BASE[to];
    if (!Number.isFinite(f) || !Number.isFinite(t)) {
      throw new Error('Static fallback: pair not supported');
    }
    return { value: t / f, provider: 'static', attributionUrl: null };
  },
};