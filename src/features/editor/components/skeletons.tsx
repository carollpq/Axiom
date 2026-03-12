// Loading skeleton components for editor dashboard.

import { PulseBlock } from '@/src/shared/components/pulse-block';
import { DashboardCard } from '@/src/shared/components/dashboard-card';
import { CarouselSkeleton } from '@/src/shared/components/carousel-skeleton';
import { ProfileSkeleton } from '@/src/shared/components/profile-skeleton';

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
