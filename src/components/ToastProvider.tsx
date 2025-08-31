'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';
export type ToastAction = { label: string; onClick: () => void };

export type ToastItem = {
  id: string;
  message: string;
  type?: ToastType;
  action?: ToastAction;
  duration?: number; // ms
};

type ToastContextValue = {
  toast: (t: Omit<ToastItem, 'id'>) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function genId(): string {
  const g = globalThis as unknown as { crypto?: Crypto };
  const c = g?.crypto;
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t as unknown as number);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (t: Omit<ToastItem, 'id'>) => {
      const id = genId();
      const item: ToastItem = { id, duration: 6000, type: 'info', ...t };
      setItems((prev) => [...prev, item]);

      if (item.duration && item.duration > 0) {
        const to = setTimeout(() => dismiss(id), item.duration);
        timers.current.set(id, to);
      }
      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    // Copia a ref para evitar o aviso do ESLint no cleanup
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t as unknown as number));
      map.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed z-50 bottom-4 right-4 flex flex-col gap-2 w-[min(92vw,380px)]">
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={[
              'rounded-xl shadow-lg border px-4 py-3 text-sm flex items-start gap-3 bg-white',
              t.type === 'success' && 'border-green-200',
              t.type === 'info' && 'border-blue-200',
              t.type === 'warning' && 'border-yellow-200',
              t.type === 'error' && 'border-red-200',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div className="mt-0.5">
              {t.type === 'success' && '✅'}
              {t.type === 'info' && 'ℹ️'}
              {t.type === 'warning' && '⚠️'}
              {t.type === 'error' && '⛔'}
            </div>
            <div className="flex-1">
              <div className="text-gray-900">{t.message}</div>
              {t.action && (
                <button
                  type="button"
                  className="mt-1 underline underline-offset-2 text-gray-800 hover:opacity-80"
                  onClick={() => {
                    t.action?.onClick();
                    dismiss(t.id);
                  }}
                >
                  {t.action.label}
                </button>
              )}
            </div>
            <button
              type="button"
              aria-label="Fechar"
              className="opacity-60 hover:opacity-100"
              onClick={() => dismiss(t.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
