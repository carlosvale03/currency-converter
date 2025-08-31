'use client';

type Props = {
  loading: boolean;
  resultText: string | null;
  details?: string | null;
};

export default function ResultPanel({ loading, resultText, details }: Props) {
  return (
    <div aria-live="polite" className="min-h-[3rem]">
      {loading && <div className="animate-pulse text-gray-500">Calculando…</div>}
      {!loading && resultText && (
        <div className="text-xl font-semibold">{resultText}</div>
      )}
      {!loading && details && (
        <div className="text-xs text-gray-500 mt-1">{details}</div>
      )}
    </div>
  );
}
