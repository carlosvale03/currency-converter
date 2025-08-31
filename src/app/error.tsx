'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error(
      `route error: ${error.message}${
        error.digest ? ` (digest ${error.digest})` : ''
      }`
    );
  }, [error]);

  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center text-center p-6">
      <h2 className="text-xl font-semibold mb-2">Algo deu errado</h2>
      <p className="text-sm text-gray-600 mb-4">
        Ocorreu um erro inesperado ao carregar esta página.
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 rounded-lg bg-black text-white"
      >
        Tentar novamente
      </button>
    </div>
  );
}
