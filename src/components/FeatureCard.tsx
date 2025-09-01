'use client';
export default function FeatureCard({
  title, desc, icon,
}: { title: string; desc: string; icon?: string }) {
  return (
    <div className="card p-4">
      <div className="text-2xl mb-2">{icon ?? '✨'}</div>
      <div className="text-[var(--text-primary)] font-medium">{title}</div>
      <p className="text-sm text-[var(--text-secondary)] mt-1">{desc}</p>
    </div>
  );
}
