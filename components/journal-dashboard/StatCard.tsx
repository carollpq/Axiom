interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  alert?: boolean;
}

export function StatCard({ label, value, sub, alert }: StatCardProps) {
  return (
    <div
      className="rounded-[6px] px-6 py-5 flex-1 min-w-[150px]"
      style={{
        background: "linear-gradient(145deg, rgba(45,42,38,0.9), rgba(35,32,28,0.9))",
        border: "1px solid rgba(120,110,95,0.25)",
      }}
    >
      <div
        className="text-[32px] font-serif font-normal tracking-[-1px]"
        style={{ color: alert ? "#d4645a" : "#e8e0d4" }}
      >
        {value}
      </div>
      <div className="text-[11px] text-[#8a8070] uppercase tracking-[1.5px] mt-1">
        {label}
      </div>
      {sub && (
        <div className="text-[10px] text-[#4a4238] mt-1">{sub}</div>
      )}
    </div>
  );
}
