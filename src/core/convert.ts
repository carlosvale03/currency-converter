import Decimal from 'decimal.js';
import type { Rate } from './money';

Decimal.set({ rounding: Decimal.ROUND_HALF_EVEN }); // arredondamento bancário

export function convert(amount: string | number, rate: Rate): string {
  const amt = new Decimal(amount);
  if (amt.isNegative()) {
    throw new Error('Amount must be >= 0');
  }
  const r = new Decimal(rate.value);
  return amt.mul(r).toFixed(2); // 2 casas p/ moedas fiduciárias
}
