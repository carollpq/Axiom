export function PulseBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-[6px] ${className ?? ''}`}
      style={{ background: 'rgba(45,42,38,0.5)' }}
    />
  );
}
