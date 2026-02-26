function PulseBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-[6px] ${className ?? ""}`}
      style={{ background: "rgba(45,42,38,0.5)" }}
    />
  );
}

export default function ManagementLoading() {
  return (
    <div className="max-w-[1200px] mx-auto px-10 py-8 space-y-6">
      <PulseBlock className="h-8 w-[300px]" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <PulseBlock key={i} className="h-[100px]" />
        ))}
      </div>
      <PulseBlock className="h-[140px]" />
      <PulseBlock className="h-[140px]" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <PulseBlock key={i} className="h-[160px]" />
        ))}
      </div>
    </div>
  );
}
