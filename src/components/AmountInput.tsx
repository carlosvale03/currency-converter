'use client';
import { useId } from 'react';

type Props = {
  amount: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  maxLength?: number;
};

export default function AmountInput({ amount, onChange, error, hint, maxLength }: Props) {
  const id = useId();
  const helpId = `${id}-help`;
  const base = 
    'border rounded-lg h-11 px-3 text-base sm:text-lg outline-none transition ' +
    'focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 ' +
    'text-[var(--text-primary)] placeholder:text-[color:var(--text-secondary)]';
const cls = error
    ? `${base} border-red-500 focus:ring-red-300`
    : `${base} border-[color:var(--border)] focus:ring:var(--border)`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">Valor</label>
      <input
        id={id}
        inputMode="decimal"
        className={cls}
        placeholder="0.00"
        value={amount}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={helpId}
        aria-invalid={!!error}
        maxLength={maxLength}
      />
      {error ? (
        <span id={helpId} className="text-xs text-red-600">{error}</span>
      ) : (
        <span id={helpId} className="text-xs text-gray-500">
          {hint ?? 'Use ponto para decimais. Ex.: 1234.56'}
        </span>
      )}
    </div>
  );
}
