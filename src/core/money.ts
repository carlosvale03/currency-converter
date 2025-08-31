export type Currency = 'USD' | 'EUR' | 'BRL';

export const SUPPORTED_CURRENCIES: Currency[] = ['USD', 'EUR', 'BRL'];

export type Rate = {
  from: Currency;
  to: Currency;
  value: string;
};
