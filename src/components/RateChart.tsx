'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Currency } from '@/core/money';
import Skeleton from './Skeleton';

type Props = { from: Currency; to: Currency; days?: number; height?: number };
type Point = { date: string; value: number };
type Meta = { provider: 'yahoo' | 'frankfurter'; granularity: 'intraday' | 'daily' };

export default function RateChart({ from, to, days = 7, height = 160 }: Props) {
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<Point[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState<string | null>(null);

  // interação
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const w = 360;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/timeseries?from=${from}&to=${to}&days=${days}`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error('timeseries http');
        return (await r.json()) as { series: Point[]; meta: Meta };
      })
      .then((json) => {
        if (!alive) return;
        setPoints(json.series);
        setMeta(json.meta);
        setError(null);
      })
      .catch(() => { if (alive) setError('Sem dados no momento.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [from, to, days]);

  const calc = useMemo(() => {
    if (!points.length) {
      return {
        path: '', area: '', min: 0, max: 0, first: null as Point | null, last: null as Point | null,
        startLabel: '', endLabel: '', xs: [] as number[], ys: [] as number[],
      };
    }
    const h = height;
    const minV = Math.min(...points.map((p) => p.value));
    const maxV = Math.max(...points.map((p) => p.value));
    const padY = (maxV - minV) * 0.1 || 0.01;
    const lo = minV - padY;
    const hi = maxV + padY;

    const denom = Math.max(1, points.length - 1);
    const sx = (i: number) => (i / denom) * (w - 8) + 4;
    const sy = (v: number) => {
      const t = (v - lo) / (hi - lo);
      return h - 12 - t * (h - 24);
    };

    const xs: number[] = [];
    const ys: number[] = [];
    const segs: string[] = [];

    points.forEach((p, i) => {
      const x = sx(i);
      const y = sy(p.value);
      xs.push(x); ys.push(y);
      segs.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
    });

    const path = segs.join(' ');
    const area = `M 4 ${h - 12} ${segs.join(' ').replace(/^M[^L]*/, '')} L ${sx(points.length - 1)} ${h - 12} Z`;

    return {
      path, area,
      min: minV, max: maxV,
      first: points[0], last: points[points.length - 1],
      startLabel: points[0]?.date.slice(0, 10), endLabel: points[points.length - 1]?.date.slice(0, 10),
      xs, ys,
    };
  }, [points, height]);

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current || !points.length) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const xInView = Math.max(0, Math.min(rect.width, clientX));
    const x = (xInView / rect.width) * w;

    // índice aproximado pelo inverso de sx
    const denom = Math.max(1, points.length - 1);
    const i = Math.round(((x - 4) / (w - 8)) * denom);
    const clamped = Math.max(0, Math.min(points.length - 1, i));
    setHoverIdx(clamped);
  }
  function onLeave() {
    setHoverIdx(null); // tooltip some ao sair do gráfico
  }

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-5 w-48 rounded" />
          <Skeleton className="h-5 w-20 rounded" />
        </div>
        <Skeleton className="h-40 w-full rounded" />
      </div>
    );
  }

  if (error || !points.length || !meta) {
    return <div className="text-sm text-[var(--text-secondary)]">{error ?? 'Sem dados.'}</div>;
  }

  const { path, area, min, max, first, last, startLabel, endLabel, xs, ys } = calc;
  const change = last && first ? ((last.value - first.value) / first.value) * 100 : 0;
  const changeLabel = `${change >= 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}%`;
  const providerLabel =
    meta.provider === 'yahoo' ? 'Yahoo (intraday)' : 'Frankfurter (diário – apenas dias úteis)';

  const show = hoverIdx !== null ? points[hoverIdx] : null;
  const showX = hoverIdx !== null ? xs[hoverIdx] : 0;

  return (
    <div className="relative">
      {/* Cabeçalho em duas linhas */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm">
          <div className="font-medium">Taxa {from} → {to}</div>
          <div>
            <span className="font-medium">Últimos {days} dias</span>{' '}
            <span className="text-[var(--text-secondary)]">({startLabel} → {endLabel})</span>
          </div>
        </div>
        <div className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>{changeLabel}</div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${w} ${height}`}
        className="w-full h-auto"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        <path d={area} fill="rgba(0,60,95,0.10)" />
        <path d={path} stroke="rgb(0,60,95)" strokeWidth="2" fill="none" />

        {hoverIdx !== null && (
          <>
            <line
              x1={showX} y1={12}
              x2={showX} y2={height - 12}
              stroke="rgba(0,60,95,0.4)" strokeWidth="1"
            />
            <circle
              cx={showX} cy={ys[hoverIdx]} r="4"
              fill="rgb(0,60,95)" stroke="#fff" strokeWidth="1.5"
            />
          </>
        )}
      </svg>

      {/* Tooltip: visível apenas durante o hover */}
      {hoverIdx !== null && show && (
        <div
          className="absolute pointer-events-none text-xs bg-white/95 border border-[color:var(--border)] rounded px-2 py-1 shadow-sm"
          style={{
            left: `calc(min(100% - 140px, max(0px, ${(showX / w) * 100}% - 70px)))`,
            top: 10,
          }}
        >
          <div className="font-medium">{from} → {to}</div>
          <div>Valor: {show.value.toFixed(6)}</div>
          <div className="text-[var(--text-secondary)]">{show.date}</div>
        </div>
      )}

      <div className="mt-2 grid grid-cols-3 text-xs text-[var(--text-secondary)]">
        <div>Mín: {min.toFixed(4)}</div>
        <div className="text-center">Atual: {last?.value.toFixed(4)}</div>
        <div className="text-right">Máx: {max.toFixed(4)}</div>
      </div>

      <div className="mt-2 text-xs text-[var(--text-secondary)]">
        Fonte: <span className="font-medium">{providerLabel}</span>
      </div>
    </div>
  );
}
