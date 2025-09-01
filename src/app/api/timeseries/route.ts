import { NextResponse } from 'next/server';
import { getSeriesWithFallback } from '@/server/rates/timeseries';
import type { Currency } from '@/core/money';

const SUPPORTED = new Set<Currency>(['USD', 'EUR', 'BRL']);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = (searchParams.get('from') ?? 'USD').toUpperCase() as Currency;
  const to = (searchParams.get('to') ?? 'BRL').toUpperCase() as Currency;
  const days = Number(searchParams.get('days') ?? 7);

  if (!SUPPORTED.has(from) || !SUPPORTED.has(to) || !Number.isFinite(days)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  try {
    const { points, meta } = await getSeriesWithFallback(from, to, days);
    return NextResponse.json({ series: points, meta });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch timeseries' }, { status: 502 });
  }
}
