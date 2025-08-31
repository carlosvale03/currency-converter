'use client';

type Props = { onClick: () => void };

export default function SwapButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full p-2 border hover:bg-gray-50 transition"
      aria-label="Inverter moedas"
      title="Inverter moedas"
    >
      ⇄
    </button>
  );
}
