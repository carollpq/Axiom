function PulseBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-[6px] ${className ?? ""}`}
      style={{ background: "rgba(45,42,38,0.5)" }}
    />
  );
}

export default function EditorDashboardLoading() {
  return (
    <div className="max-w-[1200px] mx-auto px-10 py-8">
      {/* DashboardHeader skeleton */}
      <div className="mb-8">
        <PulseBlock className="h-8 w-[260px] mb-2" />
        <PulseBlock className="h-4 w-[340px]" />
      </div>

      {/* Stats row */}
      <div className="flex gap-4 mb-8 flex-wrap">
        {Array.from({ length: 6 }).map((_, i) => (
          <PulseBlock key={i} className="h-[90px] flex-1 min-w-[130px]" />
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 mb-8">
        <PulseBlock className="h-9 w-[150px]" />
        <PulseBlock className="h-9 w-[170px]" />
        <PulseBlock className="h-9 w-[140px]" />
      </div>
    </div>
  );
}
