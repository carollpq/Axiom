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
    <div className="max-w-[1280px] mx-auto py-8 px-10">
      <div className="flex gap-8">
        <div className="flex-1">
          <PulseBlock className="h-[300px]" />
        </div>
        <div style={{ width: 280 }}>
          <PulseBlock className="h-[260px]" />
        </div>
      </div>
    </div>
  );
}
