'use client';

type Props = { onClick: () => void };

export default function SwapButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full h-11 w-11 border transition border-[color:var(--border)] 
      hover:bg-[var(--background-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] 
      focus-visible:ring-offset-2 cursor-pointer"
      aria-label="Inverter moedas"
      title="Inverter moedas"
    >
      ⇄
    </button>

  );
}
