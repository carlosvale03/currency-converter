import { NextResponse } from 'next/server';
import { getLatestRateWithFallback } from '@/server/rates/latest';
import { ALL_CURRENCIES, type Currency } from '@/core/money';

const SUPPORTED = new Set<Currency>(ALL_CURRENCIES);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = (searchParams.get('from') ?? 'USD').toUpperCase() as Currency;
  const to = (searchParams.get('to') ?? 'BRL').toUpperCase() as Currency;

  if (!SUPPORTED.has(from) || !SUPPORTED.has(to)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  try {
    const rate = await getLatestRateWithFallback(from, to);
    return NextResponse.json(rate);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch rate' }, { status: 502 });
  }
}
