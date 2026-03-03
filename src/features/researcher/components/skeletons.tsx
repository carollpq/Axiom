// Loading skeleton components — pure markup, no client directives needed.
// Used by loading.tsx files for each author route.

function PulseBlock({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{ background: "rgba(45,42,38,0.8)" }}
    />
  );
}

/** 4 stat cards matching StatCard dimensions */
export function StatsSkeleton() {
  return (
    <div className="flex gap-4 mb-8 flex-wrap">
      {[0, 1, 2, 3].map((i) => (
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

/** Papers table: header + 5 rows */
export function PapersTableSkeleton() {
  return (
    <div
      className="rounded-lg overflow-hidden mt-4"
      style={{ border: "1px solid rgba(120,110,95,0.15)" }}
    >
      {/* Header */}
      <div
        className="flex gap-4 px-5 py-3"
        style={{ background: "rgba(45,42,38,0.8)", borderBottom: "1px solid rgba(120,110,95,0.15)" }}
      >
        {["w-28", "w-20", "w-16", "w-20", "w-16"].map((w, i) => (
          <PulseBlock key={i} className={`h-3 ${w}`} />
        ))}
      </div>
      {/* Rows */}
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex gap-4 px-5 py-4 items-center"
          style={{ borderBottom: "1px solid rgba(120,110,95,0.08)" }}
        >
          <PulseBlock className="h-3 flex-1" />
          <PulseBlock className="h-3 w-20" />
          <PulseBlock className="h-3 w-16" />
          <PulseBlock className="h-3 w-20" />
          <PulseBlock className="h-3 w-14" />
        </div>
      ))}
    </div>
  );
}

/** 3 pending action rows */
export function PendingSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex items-start gap-3.5 px-5 py-4 rounded-r-[6px]"
          style={{ background: "rgba(45,42,38,0.5)", border: "1px solid rgba(120,110,95,0.15)", borderLeft: "3px solid rgba(120,110,95,0.3)" }}
        >
          <PulseBlock className="w-8 h-8 rounded-full shrink-0" />
          <div className="flex-1">
            <PulseBlock className="h-3 w-3/4 mb-2" />
            <PulseBlock className="h-2.5 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** 5 activity timeline items */
export function ActivitySkeleton() {
  return (
    <div className="relative pl-6">
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[rgba(120,110,95,0.1)]" />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-start gap-4 mb-5">
          <div
            className="w-3.5 h-3.5 rounded-full shrink-0 absolute -left-[-1px]"
            style={{ background: "rgba(120,110,95,0.2)", border: "2px solid rgba(120,110,95,0.3)" }}
          />
          <div className="flex-1">
            <PulseBlock className="h-3 w-3/4 mb-1.5" />
            <PulseBlock className="h-2.5 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Explorer: search bar + filter chips + 5 paper cards */
export function ExplorerListSkeleton() {
  return (
    <div className="max-w-[1200px] mx-auto px-10 py-8">
      <div className="mb-6">
        <PulseBlock className="h-8 w-48 mb-4" />
        <PulseBlock className="h-10 w-full rounded-lg mb-4" />
        <div className="flex gap-2">
          {["w-20", "w-24", "w-20", "w-16", "w-28"].map((w, i) => (
            <PulseBlock key={i} className={`h-7 rounded-full ${w}`} />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-lg p-5"
            style={{ border: "1px solid rgba(120,110,95,0.15)", background: "rgba(45,42,38,0.5)" }}
          >
            <PulseBlock className="h-4 w-3/4 mb-3" />
            <PulseBlock className="h-3 w-1/2 mb-2" />
            <PulseBlock className="h-3 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Paper detail: back-button stub + title + three content sections */
export function PaperDetailSkeleton() {
  return (
    <div className="max-w-[1200px] mx-auto py-8 px-10">
      <PulseBlock className="h-3 w-28 mb-5" />
      <PulseBlock className="h-6 w-3/4 mb-2" />
      <PulseBlock className="h-3 w-48 mb-6" />
      {/* Authors section */}
      <div
        className="rounded-lg p-5 mb-4"
        style={{ border: "1px solid rgba(120,110,95,0.15)", background: "rgba(45,42,38,0.5)" }}
      >
        <PulseBlock className="h-3 w-24 mb-3" />
        <div className="flex gap-4">
          <PulseBlock className="h-3 flex-1" />
          <PulseBlock className="h-3 flex-1" />
        </div>
      </div>
      {/* Abstract section */}
      <div
        className="rounded-lg p-5 mb-4"
        style={{ border: "1px solid rgba(120,110,95,0.15)", background: "rgba(45,42,38,0.5)" }}
      >
        <PulseBlock className="h-3 w-20 mb-3" />
        <PulseBlock className="h-3 w-full mb-2" />
        <PulseBlock className="h-3 w-5/6 mb-2" />
        <PulseBlock className="h-3 w-4/6" />
      </div>
      {/* Tab bar stub */}
      <div className="flex gap-2 mt-5">
        {["w-20", "w-24", "w-20", "w-16"].map((w, i) => (
          <PulseBlock key={i} className={`h-8 rounded-sm ${w}`} />
        ))}
      </div>
    </div>
  );
}

/** Contract builder: heading + two content blocks */
export function ContractBuilderSkeleton() {
  return (
    <div className="max-w-[1200px] mx-auto py-8 px-10">
      <PulseBlock className="h-4 w-32 mb-2" />
      <PulseBlock className="h-8 w-72 mb-1" />
      <PulseBlock className="h-3 w-56 mb-8" />
      <div
        className="rounded-lg p-6 mb-6"
        style={{ border: "1px solid rgba(120,110,95,0.15)", background: "rgba(45,42,38,0.5)" }}
      >
        <PulseBlock className="h-4 w-40 mb-4" />
        <PulseBlock className="h-10 w-full rounded" />
      </div>
      <div
        className="rounded-lg p-6"
        style={{ border: "1px solid rgba(120,110,95,0.15)", background: "rgba(45,42,38,0.5)" }}
      >
        <PulseBlock className="h-4 w-40 mb-4" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-4 mb-3">
            <PulseBlock className="h-3 flex-1" />
            <PulseBlock className="h-3 w-16" />
            <PulseBlock className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Paper registration: heading + 4-step indicator + content block */
export function PaperRegistrationSkeleton() {
  return (
    <div className="max-w-[1200px] mx-auto py-8 px-10">
      <PulseBlock className="h-4 w-32 mb-2" />
      <PulseBlock className="h-8 w-80 mb-1" />
      <PulseBlock className="h-3 w-64 mb-8" />
      {/* Step indicator */}
      <div className="flex gap-3 mb-8 items-center">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <PulseBlock className="h-7 w-7 rounded-full" />
            <PulseBlock className="h-3 w-20" />
            {i < 3 && <PulseBlock className="h-px w-8" />}
          </div>
        ))}
      </div>
      {/* Content */}
      <div
        className="rounded-lg p-6"
        style={{ border: "1px solid rgba(120,110,95,0.15)", background: "rgba(45,42,38,0.5)" }}
      >
        <PulseBlock className="h-4 w-40 mb-4" />
        <PulseBlock className="h-10 w-full rounded mb-4" />
        <PulseBlock className="h-24 w-full rounded mb-4" />
        <PulseBlock className="h-10 w-full rounded" />
      </div>
    </div>
  );
}
