// Loading skeleton components for editor dashboard.

import { PulseBlock } from '@/src/shared/components/pulse-block';
import { DashboardCard } from '@/src/shared/components/dashboard-card';

/** 5 stat cards matching reviewer-style dimensions */
export function StatsSkeleton() {
  return (
    <>
      <PulseBlock className="h-6 w-44 mb-6" />
      <div className="grid grid-cols-5 gap-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="dashboard-stat-card">
            <PulseBlock className="h-8 w-12 mx-auto mb-2" />
            <PulseBlock className="h-4 w-20 mx-auto" />
          </div>
        ))}
      </div>
    </>
  );
}

/** 3 submission card placeholders */
export function CarouselSkeleton() {
  return (
    <div>
      <PulseBlock className="h-6 w-44 mb-6" />
      <div className="flex gap-4 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="min-w-[280px] rounded-md p-5"
            style={{
              backgroundColor: 'rgba(100,90,75,0.2)',
              border: '1px solid rgba(180,160,130,0.4)',
            }}
          >
            <PulseBlock className="h-4 w-3/4 mb-3" />
            <PulseBlock className="h-3 w-1/2 mb-2" />
            <PulseBlock className="h-3 w-2/3 mb-2" />
            <PulseBlock className="h-3 w-1/3 mb-3" />
            <PulseBlock className="h-6 w-28 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Profile card placeholder for the right column */
function ProfileSkeleton() {
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

/** Full dashboard skeleton matching the 3-column grid layout */
export function DashboardSkeleton() {
  return (
    <>
      <PulseBlock className="h-8 w-48 mb-8" />
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-8">
          <DashboardCard>
            <StatsSkeleton />
          </DashboardCard>
          <DashboardCard>
            <CarouselSkeleton />
          </DashboardCard>
        </div>
        <div>
          <ProfileSkeleton />
        </div>
      </div>
    </>
  );
}
