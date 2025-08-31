import type { Rate } from '@/core/money';

export type ProviderId = 'frankfurter' | 'open-er-api' | 'currency-api';

export type RateWithMeta = Rate & {
    provider?: ProviderId;
    attributionUrl?: string | null;
};