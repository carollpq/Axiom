import { StatsSkeleton, PapersTableSkeleton } from "@/components/shared/skeletons";

export default function DashboardLoading() {
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
