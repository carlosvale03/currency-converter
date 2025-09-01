export type Currency =
  | 'USD' | 'EUR' | 'BRL'
  | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF'
  | 'BTC' | 'ETH' | 'USDT';

export const FIAT_CURRENCIES: Currency[] = [
  'USD', 'EUR', 'BRL', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF',
];

export const CRYPTO_CURRENCIES: Currency[] = ['BTC', 'ETH', 'USDT'];

export const ALL_CURRENCIES: Currency[] = [...FIAT_CURRENCIES, ...CRYPTO_CURRENCIES];

export function isCrypto(c: Currency): boolean {
  return (CRYPTO_CURRENCIES as string[]).includes(c);
}

const NAMES: Record<Currency, string> = {
  USD: 'Dólar americano',
  EUR: 'Euro',
  BRL: 'Real brasileiro',
  GBP: 'Libra esterlina',
  JPY: 'Iene japonês',
  CAD: 'Dólar canadense',
  AUD: 'Dólar australiano',
  CHF: 'Franco suíço',
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  USDT: 'Tether (USDt)',
};

export function currencyLabel(c: Currency): string {
  return isCrypto(c) ? `${c} · CRYPTO` : `${c}`;
}
export function currencyLongLabel(c: Currency): string {
  return isCrypto(c) ? `${c} — ${NAMES[c]} (CRYPTO)` : `${c} — ${NAMES[c]}`;
}
