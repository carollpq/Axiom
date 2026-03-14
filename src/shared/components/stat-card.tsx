import type { StatCardProps } from '@/src/shared/types/shared';

export function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  alert,
}: StatCardProps) {
  return (
    <div className="flex-1 min-w-[150px] relative overflow-hidden rounded-[6px] px-6 py-5 border border-[rgba(120,110,95,0.25)] bg-[linear-gradient(145deg,rgba(45,42,38,0.9),rgba(35,32,28,0.9))]">
      {Icon && (
        <div className="absolute top-3 right-4 opacity-[0.12] text-[#c9b89e]">
          <Icon size={28} />
        </div>
      )}
      <div
        className="text-[32px] font-serif font-normal tracking-[-1px]"
        style={{ color: alert ? '#d4645a' : '#e8e0d4' }}
      >
        {value}
      </div>
      <div className="text-md text-[#8a8070] tracking-[1.5px] mt-1.5">
        {label}
      </div>
      {sub && <div className="text-[10px] text-[#4a4238] mt-1">{sub}</div>}
    </div>
  );
}
