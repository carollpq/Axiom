import { Suspense } from "react";
import { getSession } from "@/src/shared/lib/auth/auth";
import { listUserPapers } from "@/src/features/papers/queries";
import { DashboardHeader } from "@/src/shared/components";
import { StatsSection } from "@/src/features/researcher/components/dashboard/stats.section";
import { CarouselSection } from "@/src/features/researcher/components/dashboard/carousel.section";
import {
  StatsSkeleton,
  CarouselSkeleton,
} from "@/src/features/researcher/components/skeletons";

export default async function AuthorDashboard() {
  const wallet = (await getSession())!;
  const papersPromise = listUserPapers(wallet);

  return (
    <div className="max-w-[1200px] mx-auto px-10 py-8">
      <DashboardHeader role="researcher" />

      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection papersPromise={papersPromise} />
      </Suspense>

      <Suspense fallback={<CarouselSkeleton />}>
        <CarouselSection papersPromise={papersPromise} />
      </Suspense>
    </div>
  );
}
