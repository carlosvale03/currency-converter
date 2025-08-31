import 'server-only';
import { z } from 'zod';

const LogLevelEnum = z.enum(['silent', 'error', 'warn', 'info', 'debug']);

const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Endpoints dos provedores (podem ficar com defaults seguros)
  FRANKFURTER_BASE: z
    .string()
    .url()
    .default('https://api.frankfurter.dev/v1'),
  OPEN_ER_API_BASE: z
    .string()
    .url()
    .default('https://open.er-api.com/v6'),
  CURRENCY_API_CDN_BASE: z
    .string()
    .url()
    .default(
      'https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies'
    ),
  LOG_LEVEL: LogLevelEnum.default('info'),
});

const parsed = ServerEnvSchema.safeParse(process.env);
if (!parsed.success) {
  // Mostra os campos problemáticos e aborta o boot (falha rápida)
  console.error('❌ Invalid server environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid server environment variables');
}

export const env = parsed.data;