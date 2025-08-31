// src/app/api/rate/route.ts
import { NextResponse } from 'next/server';
import { SUPPORTED_CURRENCIES, type Currency } from '@/core/money';
import { getRateWithFallback } from '@/server/rates';

function isSupported(c: string): c is Currency {
  return (SUPPORTED_CURRENCIES as string[]).includes(c);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';

  if (!isSupported(from) || !isSupported(to)) {
    return NextResponse.json({ error: 'Unsupported currency' }, { status: 400 });
  }

  try {
    const { value, provider, attributionUrl } = await getRateWithFallback(from, to, 3500);
    return NextResponse.json({
      from,
      to,
      rate: value,
      provider,
      attributionUrl: attributionUrl ?? null,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: 'All providers failed' }, { status: 502 });
  }
}
