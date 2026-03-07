import { DashboardCard } from '@/src/shared/components/DashboardCard';
import { DashboardStatCard } from '@/src/shared/components/DashboardStatCard';

interface PerformanceMetricsProps {
  reliabilityScore: number;
  completedReviews: number;
  invites: number;
  averageDaysToDeadline: number;
}

export function PerformanceMetrics({
  reliabilityScore,
  completedReviews,
  invites,
  averageDaysToDeadline,
}: PerformanceMetricsProps) {
  const formatScore = (score: number) => {
    return Math.round(score * 10) / 10;
  };

  return (
    <DashboardCard className="space-y-6">
      <h3 className="text-lg font-bold" style={{ color: '#d4ccc0' }}>
        Performance Metrics
      </h3>

      <div className="grid grid-cols-4 gap-4">
        <DashboardStatCard
          value={formatScore(reliabilityScore)}
          label="Review Reliability Score"
        />
        <DashboardStatCard
          value={completedReviews}
          label="Completed Verified Reviews"
        />
        <DashboardStatCard value={invites} label="Invites" />
        <DashboardStatCard
          value={formatScore(averageDaysToDeadline)}
          label="Average days to deadline"
        />
      </div>
    </DashboardCard>
  );
}
