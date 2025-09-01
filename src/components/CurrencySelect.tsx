'use client';
import { FIAT_CURRENCIES, CRYPTO_CURRENCIES, currencyLabel, Currency } from '@/core/money';

export default function CurrencySelect({
  label, value, onChange,
}: { label: string; value: Currency; onChange: (v: Currency) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Currency)}
        className="w-full border rounded-lg h-11 px-3 text-base sm:text-lg outline-none 
                   border-[color:var(--border)] text-[var(--text-primary)]
                   focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2"
      >
        <optgroup label="Moedas (fiat)">
          {FIAT_CURRENCIES.map(c => (
            <option key={c} value={c}>{currencyLabel(c)}</option>
          ))}
        </optgroup>
        <optgroup label="Criptomoedas">
          {CRYPTO_CURRENCIES.map(c => (
            <option key={c} value={c}>{currencyLabel(c)}</option>
          ))}
        </optgroup>
      </select>
    </label>
  );
}