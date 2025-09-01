'use client';

type Props = { className?: string };

export default function Skeleton({ className = '' }: Props) {
    return <div className={`skeleton ${className}`} aria-hidden="true" />;
}
