function PulseBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-[6px] ${className ?? ""}`}
      style={{ background: "rgba(45,42,38,0.5)" }}
    />
  );
}

export default function UnderReviewLoading() {
  return (
    <div className="flex" style={{ height: "calc(100vh - 56px)" }}>
      <div style={{ width: 360, borderRight: "1px solid rgba(120,110,95,0.15)" }} className="p-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <PulseBlock key={i} className="h-[100px]" />
        ))}
      </div>
      <div className="flex-1 p-8">
        <PulseBlock className="h-full" />
      </div>
      <div style={{ width: 320, borderLeft: "1px solid rgba(120,110,95,0.15)" }} className="p-4 space-y-3">
        <PulseBlock className="h-[180px]" />
        <PulseBlock className="h-[120px]" />
        <PulseBlock className="h-[200px]" />
      </div>
    </div>
  );
}
