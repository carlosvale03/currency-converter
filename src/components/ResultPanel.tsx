'use client';

import Skeleton from '@/components/Skeleton';

type Props = {
  loading: boolean;
  resultText: string | null;
  details?: string | null;
};

export default function ResultPanel({ loading, resultText, details }: Props) {
  return (
    <div aria-live="polite" className="min-h-[3rem]">
      {loading ? (
        <div role="status" className="space-y-2">
          <Skeleton className="h-7 w-40 sm:w-48 rounded-md" />
          <Skeleton className="h-3 w-56 sm:w-64 rounded-md" />
        </div>
      ) : (
        <>
          {resultText && <div className="text-2xl font-semibold">{resultText}</div>}
          {details && <div className="text-xs text-gray-500 mt-1">{details}</div>}
        </>
      )}
    </div>
  );
}
