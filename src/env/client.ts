import { z } from 'zod';

const ClientEnvSchema = z.object({
  NEXT_PUBLIC_RATE_API_BASE: z.string().url().optional(),
  NEXT_PUBLIC_LOG_LEVEL: z
    .enum(['silent', 'error', 'warn', 'info', 'debug'])
    .optional(),
});

export const clientEnv = ClientEnvSchema.parse({
  NEXT_PUBLIC_RATE_API_BASE: process.env.NEXT_PUBLIC_RATE_API_BASE,
  NEXT_PUBLIC_LOG_LEVEL: process.env.NEXT_PUBLIC_LOG_LEVEL,
});