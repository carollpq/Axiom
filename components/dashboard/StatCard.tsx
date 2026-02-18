import type { StatCardData } from "@/types/dashboard";

export function StatCard({ label, value, icon }: StatCardData) {
  return (
    <div className="flex-1 min-w-[160px] relative overflow-hidden rounded-[6px] px-6 py-5 border border-[rgba(120,110,95,0.25)] bg-[linear-gradient(145deg,rgba(45,42,38,0.9),rgba(35,32,28,0.9))]">
      <div className="absolute top-3 right-4 text-[28px] opacity-[0.12] text-[#c9b89e]">
        {icon}
      </div>
      <div className="text-[32px] font-serif text-[#e8e0d4] font-normal tracking-[-1px]">
        {value}
      </div>
      <div className="text-[11px] text-[#8a8070] uppercase tracking-[1.5px] mt-1.5">
        {label}
      </div>
    </div>
  );
}
