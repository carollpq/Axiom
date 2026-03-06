// Loading skeleton components for editor dashboard.

import { PulseBlock } from "@/src/shared/components/PulseBlock";

/** 5 stat cards matching StatCard dimensions */
export function StatsSkeleton() {
  return (
    <div className="flex gap-4 mb-8 flex-wrap">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex-1 min-w-[160px] rounded-lg p-5"
          style={{ border: "1px solid rgba(120,110,95,0.15)", background: "rgba(45,42,38,0.5)" }}
        >
          <PulseBlock className="h-4 w-20 mb-3" />
          <PulseBlock className="h-7 w-12" />
        </div>
      ))}
    </div>
  );
}

/** 3 submission card placeholders */
export function CarouselSkeleton() {
  return (
    <div className="mb-8">
      <PulseBlock className="h-4 w-36 mb-3" />
      <div className="flex gap-4 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="min-w-[280px] rounded-md p-5"
            style={{
              background: "rgba(45,42,38,0.5)",
              border: "1px solid rgba(120,110,95,0.15)",
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
