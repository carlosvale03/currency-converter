'use client';

type Props = { message: string };

export default function ErrorBanner({ message }: Props) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-3 py-2 text-sm"
    >
      {message}
    </div>
  );
}
