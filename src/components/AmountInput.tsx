'use client';
import { useId } from 'react';

type Props = {
  amount: string;
  onChange: (v: string) => void;
};

export default function AmountInput({ amount, onChange }: Props) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">Valor</label>
      <input
        id={id}
        inputMode="decimal"
        pattern="[0-9]*"
        className="border rounded-lg px-3 py-2 outline-none focus:ring ring-offset-1"
        placeholder="0.00"
        value={amount}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={`${id}-help`}
      />
      <span id={`${id}-help`} className="text-xs text-gray-500">
        Use ponto para decimais. Ex.: 1234.56
      </span>
    </div>
  );
}
