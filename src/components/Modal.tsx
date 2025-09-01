'use client';

import { useEffect } from 'react';

export default function Modal({
  open, onClose, children, title = 'Gráfico (7 dias)',
}: { open: boolean; onClose: () => void; children: React.ReactNode; title?: string; }) {
  useEffect(() => {
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    if (open) document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative z-10 card w-full max-w-xl p-5 bg-[var(--surface)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="cursor-pointer text-red-600 h-9 px-3 rounded-lg border border-red-600 
            hover:bg-[var(--background-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] 
            focus-visible:ring-offset-2"
          >
            Fechar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
