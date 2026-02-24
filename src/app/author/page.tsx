import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/src/shared/lib/auth";
import { listUserPapers } from "@/src/features/papers/queries";
import { listUserContracts } from "@/src/features/contracts/queries";
import { DashboardHeader } from "@/src/features/author/components/dashboard/dashboard.header";
import { StatsSection } from "@/src/features/author/components/dashboard/stats.section";
import { PapersSection } from "@/src/features/author/components/dashboard/papers.section";
import { PendingSection } from "@/src/features/author/components/dashboard/pending.section";
import { ActivitySection } from "@/src/features/author/components/dashboard/activity.section";
import { TabsShellClient } from "@/src/features/author/components/dashboard/tabs.shell.client";
import { QuickActions } from "@/src/features/author/components/dashboard";
import {
  StatsSkeleton,
  PapersTableSkeleton,
  PendingSkeleton,
  ActivitySkeleton,
} from "@/src/features/author/components/skeletons";

export default async function AuthorDashboard() {
  const wallet = await getSession();
  if (!wallet) redirect("/login");

  // Both queries start in parallel — neither is awaited here.
  // Each section awaits only what it needs, so stats + papers
  // stream in as soon as listUserPapers resolves, while pending
  // and activity stream in independently when listUserContracts resolves.
  const papersPromise = listUserPapers(wallet);
  const contractsPromise = listUserContracts(wallet);

  return (
    <div className="max-w-[1200px] mx-auto px-10 py-8">
      <DashboardHeader />

      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection papersPromise={papersPromise} />
      </Suspense>

      <QuickActions />

      <TabsShellClient
        papersSection={
          <Suspense fallback={<PapersTableSkeleton />}>
            <PapersSection papersPromise={papersPromise} />
          </Suspense>
        }
        pendingSection={
          <Suspense fallback={<PendingSkeleton />}>
            <PendingSection
              wallet={wallet}
              papersPromise={papersPromise}
              contractsPromise={contractsPromise}
            />
          </Suspense>
        }
        activitySection={
          <Suspense fallback={<ActivitySkeleton />}>
            <ActivitySection
              wallet={wallet}
              papersPromise={papersPromise}
              contractsPromise={contractsPromise}
            />
          </Suspense>
        }
      />
    </div>
  );
}
