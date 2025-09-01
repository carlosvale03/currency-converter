'use client';
type Props = React.PropsWithChildren<{ id?: string; className?: string }>;
export default function Section({ id, className = '', children }: Props) {
  return (
    <section id={id} className={`section ${className}`}>
      <div className="container">{children}</div>
    </section>
  );
}
