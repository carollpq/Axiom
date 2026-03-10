import type { ReputationDataPoint } from '@/src/features/reviewer/types';
import { Sparkline } from './sparkline';

interface ReputationCardProps {
  overall: number;
  change: number;
  history: ReputationDataPoint[];
}

export function ReputationCard({
  overall,
  change,
  history,
}: ReputationCardProps) {
  return (
    <div>
      <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-2">
        Reputation Score
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[48px] font-serif text-[#e8e0d4] font-normal leading-none">
          {overall}
        </span>
        <span className="text-[18px] text-[#6a6050]">/ 5.0</span>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[#8fbc8f] text-[13px]">
          {'\u25B2'} {change}
        </span>
        <span className="text-[11px] text-[#6a6050]">from last month</span>
      </div>
      <div className="mt-3">
        <Sparkline data={history} />
      </div>
    </div>
  );
}
