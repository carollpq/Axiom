import type { ReputationDataPoint, ReputationBreakdownItem } from "@/src/features/reviewer/types";
import { ReputationCard } from "./ReputationCard";
import { ReputationBreakdown } from "./ReputationBreakdown";
import { QuickStats } from "./QuickStats";
import { ReputationHistory } from "./ReputationHistory";

interface ReputationSectionProps {
  overall: number;
  change: number;
  history: ReputationDataPoint[];
  breakdown: ReputationBreakdownItem[];
  totalReviews: number;
  activeCount: number;
  overdueCount: number;
  expandedHistory: boolean;
  onToggleHistory: () => void;
}

export function ReputationSection({
  overall,
  change,
  history,
  breakdown,
  totalReviews,
  activeCount,
  overdueCount,
  expandedHistory,
  onToggleHistory,
}: ReputationSectionProps) {
  return (
    <div
      className="rounded-lg p-7 mb-8 relative overflow-hidden"
      style={{
        background: "linear-gradient(145deg, rgba(45,42,38,0.9), rgba(35,32,28,0.9))",
        border: "1px solid rgba(120,110,95,0.25)",
      }}
    >
      {/* Decorative glow */}
      <div
        className="absolute -top-5 -right-5 w-[200px] h-[200px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(201,184,158,0.04), transparent 70%)" }}
      />

      <div className="flex justify-between items-start flex-wrap gap-6">
        <ReputationCard overall={overall} change={change} history={history} />
        <ReputationBreakdown items={breakdown} />
        <QuickStats totalReviews={totalReviews} activeCount={activeCount} overdueCount={overdueCount} />
      </div>

      <ReputationHistory history={history} expanded={expandedHistory} onToggle={onToggleHistory} />
    </div>
  );
}
