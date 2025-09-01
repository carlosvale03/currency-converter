import type { Currency } from '@/core/money';

/**
 * Fallback estático: tabela "unidades da moeda POR 1 USD".
 * Para FIAT: os valores são estáveis o suficiente como aproximação.
 * Para CRYPTO: valores são APROXIMADOS (apenas para desbloquear o fluxo em caso de falha de rede),
 * NÃO representam preço de mercado atual.
 *
 * Ex.: BRL: 5.40  => 1 USD = 5.40 BRL
 *      EUR: 0.92  => 1 USD = 0.92 EUR
 *      BTC: ~1/65000 => 1 USD ≈ 0.00001538 BTC (aprox.)
 *      ETH: ~1/3000  => 1 USD ≈ 0.00033333 ETH (aprox.)
 *      USDT: 1      => 1 USD = 1 USDT
 */

// FIAT
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

// CRYPTO (aproximado; apenas para fallback)
const USD_BASE_CRYPTO = {
  BTC: 1 / 65000,     // ≈ 0.00001538 BTC por 1 USD
  ETH: 1 / 3000,      // ≈ 0.00033333 ETH por 1 USD
  USDT: 1,            // 1 USD ≈ 1 USDT
} as const;

const USD_BASE: Record<Currency, number> = {
  ...USD_BASE_FIAT,
  ...USD_BASE_CRYPTO,
} as unknown as Record<Currency, number>;

export type StaticRate = { value: number; provider?: string };

export const StaticRateProvider = {
  /**
   * Converte via razão (to / from) usando a base USD:
   * rate(from→to) = USD_BASE[to] / USD_BASE[from]
   */
  getRate(from: Currency, to: Currency): StaticRate {
    if (from === to) return { value: 1, provider: 'static' };
    const f = USD_BASE[from];
    const t = USD_BASE[to];
    if (!Number.isFinite(f) || !Number.isFinite(t)) {
      throw new Error('Static fallback: pair not supported');
    }
    return { value: t / f, provider: 'static' };
  },
};