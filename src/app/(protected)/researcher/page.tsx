import { Suspense } from 'react';
import { getSession } from '@/src/shared/lib/auth/auth';
import { getUserByWallet } from '@/src/features/users/queries';
import { listUserPapers } from '@/src/features/papers/queries';
import { getInitials } from '@/src/shared/lib/format';
import { DashboardGridLayout } from '@/src/shared/components/dashboard-grid-layout';
import { DashboardCard } from '@/src/shared/components/dashboard-card';
import { ProfileCard } from '@/src/shared/components/profile-card';
import { StatsSection } from '@/src/features/researcher/components/dashboard/stats.section';
import { CarouselSection } from '@/src/features/researcher/components/dashboard/carousel.section';
import { CarouselSkeleton } from '@/src/shared/components/carousel-skeleton';
import { StatsSkeleton } from '@/src/features/researcher/components/skeletons';

export default async function AuthorDashboard() {
  const wallet = (await getSession())!;
  // Start papers query first (not awaited — streamed via Suspense), then await user profile.
  // Both queries run concurrently since listUserPapers returns a promise immediately.
  const papersPromise = listUserPapers(wallet);
  const user = await getUserByWallet(wallet);

  const name = user?.displayName || 'Researcher';
  const initials = user?.displayName ? getInitials(user.displayName) : '?';
  const subtitle = user?.institution || 'Affiliation';

  return (
    <div className="max-w-full mx-auto px-12 py-8">
      <DashboardGridLayout
        role="researcher"
        left={
          <>
            <DashboardCard>
              <Suspense fallback={<StatsSkeleton />}>
                <StatsSection papersPromise={papersPromise} />
              </Suspense>
            </DashboardCard>
            <DashboardCard>
              <Suspense fallback={<CarouselSkeleton />}>
                <CarouselSection papersPromise={papersPromise} />
              </Suspense>
            </DashboardCard>
          </>
        }
        right={
          <ProfileCard name={name} subtitle={subtitle} initials={initials} />
        }
      />
    </div>
  );
}
