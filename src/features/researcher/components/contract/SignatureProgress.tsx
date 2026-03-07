interface SignatureProgressProps {
  signed: number;
  total: number;
}

export function SignatureProgress({ signed, total }: SignatureProgressProps) {
  const allSigned = total > 0 && signed === total;
  const pct = total > 0 ? Math.round((signed / total) * 100) : 0;
  const barColor = allSigned
    ? "linear-gradient(90deg, #8fbc8f, #a0d0a0)"
    : "linear-gradient(90deg, #c9a44a, #d4b85a)";
  const textColor = allSigned ? "#8fbc8f" : "#c9a44a";

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[#6a6050] uppercase tracking-[1px]">Signed</span>
      <div className="w-[80px] h-1.5 rounded-sm overflow-hidden" style={{ background: "rgba(120,110,95,0.2)" }}>
        <div
          className="h-full rounded-sm transition-all duration-300"
          style={{ width: pct + "%", background: barColor }}
        />
      </div>
      <span className="text-[13px] font-sans font-semibold" style={{ color: textColor }}>
        {signed}/{total}
      </span>
      {allSigned && <span className="text-[#8fbc8f] text-sm">{"\u2713"}</span>}
    </div>
  );
}
