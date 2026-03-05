import {
  StatsSkeleton,
  CarouselSkeleton,
} from "@/src/features/editor/components/skeletons";
import { PulseBlock } from "@/src/shared/components/PulseBlock";

export default function EditorDashboardLoading() {
  return (
    <div className="max-w-[1200px] mx-auto px-10 py-8">
      {/* Header + compact profile */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <PulseBlock className="h-8 w-[260px] mb-2" />
          <PulseBlock className="h-4 w-[340px]" />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <PulseBlock className="h-10 w-10 !rounded-full" />
          <div>
            <PulseBlock className="h-3 w-24 mb-1" />
            <PulseBlock className="h-2.5 w-32" />
          </div>
        </div>
      </div>

      <StatsSkeleton />
      <CarouselSkeleton />

      {/* Quick actions */}
      <div className="flex gap-3">
        <PulseBlock className="h-9 w-[150px]" />
        <PulseBlock className="h-9 w-[170px]" />
        <PulseBlock className="h-9 w-[140px]" />
      </div>
    </div>
  );
}
