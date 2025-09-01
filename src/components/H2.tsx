'use client';
export default function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-[var(--text-primary)]">
      {children}
    </h2>
  );
}
