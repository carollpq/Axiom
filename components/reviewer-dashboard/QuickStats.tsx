interface QuickStatsProps {
  totalReviews: number;
  activeCount: number;
  overdueCount: number;
}

export function QuickStats({ totalReviews, activeCount, overdueCount }: QuickStatsProps) {
  const stats = [
    { label: "Total Reviews", value: totalReviews, highlight: false },
    { label: "Active", value: activeCount, highlight: false },
    { label: "Overdue", value: overdueCount, highlight: overdueCount > 0 },
  ];

  return (
    <div className="flex flex-col gap-3 min-w-[140px]">
      {stats.map((s) => (
        <div key={s.label} className="text-right">
          <div
            className="text-[22px] font-serif"
            style={{ color: s.highlight ? "#d4645a" : "#e8e0d4" }}
          >
            {s.value}
          </div>
          <div className="text-[10px] text-[#6a6050] uppercase tracking-[1px]">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
