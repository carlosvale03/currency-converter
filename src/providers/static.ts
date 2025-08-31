import type { Currency, Rate } from '@/core/money';

/**
 * Mapa de taxa para BRL como base (exemplo).
 * Ajuste os valores conforme desejar; são apenas placeholders.
 */
const RATE_TO_BRL: Record<Currency, number> = {
  BRL: 1,
  USD: 5.00,
  EUR: 5.40,
};

function crossRate(from: Currency, to: Currency): string {
  if (from === to) return '1';
  const toBRL = RATE_TO_BRL[to];
  const fromBRL = RATE_TO_BRL[from];
  if (!toBRL || !fromBRL) throw new Error('Unsupported currency');
  // taxa from->to = (to/BRL) / (from/BRL)
  return String(toBRL / fromBRL);
}

export const StaticRateProvider = {
  getRate(from: Currency, to: Currency): Rate {
    return { from, to, value: crossRate(from, to) };
  },
};
