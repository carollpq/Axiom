import type { ReputationBreakdownItem } from '@/src/features/reviewer/types';

interface ReputationBreakdownProps {
  items: ReputationBreakdownItem[];
}

export function ReputationBreakdown({ items }: ReputationBreakdownProps) {
  return (
    <div className="grid grid-cols-2 gap-y-4 gap-x-10 min-w-[320px]">
      {items.map((m) => (
        <div key={m.label}>
          <div className="text-[10px] text-[#6a6050] uppercase tracking-[1px] mb-1">
            {m.label}
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-20 h-1 rounded-sm overflow-hidden"
              style={{ background: 'rgba(120,110,95,0.2)' }}
            >
              <div
                className="h-full rounded-sm"
                style={{
                  width: `${(m.value / 5) * 100}%`,
                  background: 'linear-gradient(90deg, #c9b89e, #d4c8a8)',
                }}
              />
            </div>
            <span className="text-[13px] text-[#c9b89e] font-sans">
              {m.value.toFixed(1)}
            </span>
          </div>
          <div className="text-[10px] text-[#4a4238] mt-0.5">{m.desc}</div>
        </div>
      ))}
    </div>
  );
}
