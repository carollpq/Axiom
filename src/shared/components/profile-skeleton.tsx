import { PulseBlock } from '@/src/shared/components/pulse-block';
import { DashboardCard } from '@/src/shared/components/dashboard-card';

export function ProfileSkeleton() {
  return (
    <DashboardCard className="text-center space-y-6">
      <div className="flex justify-center">
        <PulseBlock className="w-24 h-24 rounded-full" />
      </div>
      <div className="space-y-2">
        <PulseBlock className="h-5 w-32 mx-auto" />
        <PulseBlock className="h-3 w-24 mx-auto" />
        <PulseBlock className="h-3 w-28 mx-auto" />
      </div>
    </DashboardCard>
  );
}
