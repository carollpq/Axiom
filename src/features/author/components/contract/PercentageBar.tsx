interface PercentageBarProps {
  totalPct: number;
  isValid: boolean;
}

export function PercentageBar({ totalPct, isValid }: PercentageBarProps) {
  const barColor = isValid
    ? "linear-gradient(90deg, #8fbc8f, #a0d0a0)"
    : totalPct > 100
      ? "#d4645a"
      : "linear-gradient(90deg, #c9b458, #d4c868)";

  const textColor = isValid ? "#8fbc8f" : totalPct > 100 ? "#d4645a" : "#c9b458";

  return (
    <div className="flex items-center gap-2">
      <div className="w-[120px] h-1.5 rounded-sm overflow-hidden" style={{ background: "rgba(120,110,95,0.2)" }}>
        <div
          className="h-full rounded-sm transition-all duration-300"
          style={{ width: Math.min(totalPct, 100) + "%", background: barColor }}
        />
      </div>
      <span className="text-[13px] font-sans font-semibold" style={{ color: textColor }}>{totalPct}%</span>
      {isValid && <span className="text-[#8fbc8f] text-sm">{"\u2713"}</span>}
    </div>
  );
}
