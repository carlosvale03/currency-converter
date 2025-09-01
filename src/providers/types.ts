import type { Rate } from '@/core/money';

export type ProviderId = 'frankfurter' | 'open-er-api' | 'currency-api' | 'static';

export type RateWithMeta = Rate & {
  provider?: ProviderId;            // opcional p/ compatibilidade com retornos antigos
  attributionUrl?: string | null;
};