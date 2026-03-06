import { PulseBlock } from "@/src/shared/components/PulseBlock";

/** Dashboard page skeleton — stats + profile + insights */
export function DashboardSkeleton() {
  return (
    <div className="max-w-[1200px] mx-auto px-10 py-8">
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
      {/* Stats row */}
      <div className="flex gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 rounded-[6px] p-5 border border-[rgba(120,110,95,0.25)]">
            <PulseBlock className="h-7 w-12 mb-2" />
            <PulseBlock className="h-4 w-20" />
          </div>
        ))}
      </div>
      {/* Content area */}
      <PulseBlock className="h-64 w-full" />
    </div>
  );
}

/** Incoming invites page skeleton */
export function InvitesSkeleton() {
  return (
    <div className="max-w-[1200px] mx-auto px-10 py-8">
      <PulseBlock className="h-8 w-[200px] mb-6" />
      {[1, 2].map((i) => (
        <div key={i} className="mb-4 rounded-[6px] border border-[rgba(120,110,95,0.25)] p-6">
          <PulseBlock className="h-5 w-[300px] mb-3" />
          <PulseBlock className="h-4 w-[200px] mb-2" />
          <PulseBlock className="h-32 w-full" />
        </div>
      ))}
    </div>
  );
}

/** Three-column layout skeleton (assigned / completed pages) */
export function ThreeColumnSkeleton() {
  return (
    <div className="flex" style={{ height: "calc(100vh - 56px)" }}>
      {/* Left list */}
      <div style={{ width: 360, borderRight: "1px solid rgba(120,110,95,0.15)" }} className="p-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <PulseBlock className="h-4 w-[80%] mb-2" />
            <PulseBlock className="h-3 w-[60%] mb-1" />
            <PulseBlock className="h-3 w-full" />
          </div>
        ))}
      </div>
      {/* Center viewer */}
      <div className="flex-1 p-6">
        <PulseBlock className="h-full w-full" />
      </div>
      {/* Right sidebar */}
      <div style={{ width: 320, borderLeft: "1px solid rgba(120,110,95,0.15)" }} className="p-4 space-y-4">
        <PulseBlock className="h-4 w-24" />
        <PulseBlock className="h-3 w-32" />
        <PulseBlock className="h-3 w-28" />
        <PulseBlock className="h-20 w-full" />
      </div>
    </div>
  );
}

/** Review workspace page skeleton */
export function WorkspaceSkeleton() {
  return (
    <div className="flex" style={{ height: "calc(100vh - 56px)" }}>
      {/* Left — paper panel */}
      <div className="flex-1 p-6">
        <PulseBlock className="h-6 w-[60%] mb-3" />
        <PulseBlock className="h-4 w-[40%] mb-6" />
        <PulseBlock className="h-[70vh] w-full" />
      </div>
      {/* Right — criteria sidebar */}
      <div style={{ width: 420, borderLeft: "1px solid rgba(120,110,95,0.15)" }} className="p-4 space-y-4">
        <PulseBlock className="h-5 w-32 mb-4" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="mb-4">
            <PulseBlock className="h-4 w-full mb-2" />
            <PulseBlock className="h-8 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
