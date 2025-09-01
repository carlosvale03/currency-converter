'use client';
import { useId } from 'react';
import type { Currency } from '@/core/money';
import { SUPPORTED_CURRENCIES } from '@/core/money';

type Props = {
  label: string;
  value: Currency;
  onChange: (c: Currency) => void;
};

export default function CurrencySelect({ label, value, onChange }: Props) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <select
        id={id}
        className="border rounded-lg h-11 px-3 text-base sm:text-lg outline-none 
          border-[color:var(--border)] text-[var(--text-primary)] 
          focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2"
        value={value}
        onChange={(e) => onChange(e.target.value as Currency)}
      >
        {SUPPORTED_CURRENCIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </div>
  );
}
