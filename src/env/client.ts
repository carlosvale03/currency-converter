import { z } from 'zod';

const ClientEnvSchema = z.object({
  NEXT_PUBLIC_RATE_API_BASE: z.string().url().optional(),
});

export const clientEnv = ClientEnvSchema.parse({
  NEXT_PUBLIC_RATE_API_BASE: process.env.NEXT_PUBLIC_RATE_API_BASE,
});