import { PulseBlock } from '@/src/shared/components/pulse-block';
import { DashboardCard } from '@/src/shared/components/dashboard-card';
import { ProfileSkeleton } from '@/src/shared/components/profile-skeleton';
import { CarouselSkeleton } from '@/src/shared/components/carousel-skeleton';
import { StatsSkeleton } from '@/src/features/researcher/components/skeletons';

export default function DashboardLoading() {
  return (
    <div className="max-w-full mx-auto px-12 py-8">
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
    </div>
  );
}
