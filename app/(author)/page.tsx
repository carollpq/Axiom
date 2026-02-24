import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { listUserPapers } from "@/features/papers";
import { computeActivityData } from "@/features/author/queries/activity";
import { mapDbPaperToFrontend, computeStats } from "@/features/author/mappers/dashboard";
import { DashboardClient } from "@/features/author/components/dashboard";
import { StatsSkeleton, PapersTableSkeleton } from "@/features/author/components/skeletons";
import type { ApiPaper } from "@/types/api";

async function DashboardContent() {
  const wallet = await getSession();
  if (!wallet) redirect("/");

  const raw = listUserPapers(wallet) as unknown as ApiPaper[];
  const papers = raw.map(mapDbPaperToFrontend);
  const stats = computeStats(papers);
  const { pendingActions, activity } = computeActivityData(wallet);

  return (
    <DashboardClient
      initialPapers={papers}
      initialStats={stats}
      initialPendingActions={pendingActions}
      initialActivity={activity}
    />
  );
}

function DashboardFallback() {
  return (
    <div className="max-w-[1200px] mx-auto px-10 py-8">
      <div className="mb-8">
        <div
          className="animate-pulse h-8 w-48 rounded mb-2"
          style={{ background: "rgba(45,42,38,0.8)" }}
        />
        <div
          className="animate-pulse h-3 w-64 rounded"
          style={{ background: "rgba(45,42,38,0.8)" }}
        />
      </div>
      <StatsSkeleton />
      <PapersTableSkeleton />
    </div>
  );
}

export default function AuthorDashboard() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent />
    </Suspense>
  );
}
