import { PulseBlock } from "@/src/shared/components/PulseBlock";

export default function AcceptedPapersLoading() {
  return (
    <div>
      {/* Header strip skeleton */}
      <div
        className="flex items-center justify-between px-5"
        style={{ height: 44, borderBottom: "1px solid rgba(120,110,95,0.15)" }}
      >
        <PulseBlock className="h-3 w-28" />
        <PulseBlock className="h-3 w-16" />
      </div>

      <div className="flex" style={{ height: "calc(100vh - 56px - 44px)" }}>
        <div style={{ width: 360, borderRight: "1px solid rgba(120,110,95,0.15)" }} className="p-4 space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <PulseBlock key={i} className="h-[100px]" />
          ))}
        </div>
        <div className="flex-1 p-8">
          <PulseBlock className="h-full" />
        </div>
        <div style={{ width: 320, borderLeft: "1px solid rgba(120,110,95,0.15)" }}>
          <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(120,110,95,0.12)" }}>
            <PulseBlock className="h-2.5 w-16" />
          </div>
          <div className="p-4 space-y-3">
            <PulseBlock className="h-[160px]" />
            <PulseBlock className="h-[60px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
