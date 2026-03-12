// Loading skeleton components for editor pages.
// DashboardSkeleton: main dashboard (stats + carousel grid).
// ThreeColumnSkeleton: content pages (incoming, under-review, accepted) with
//   paper list | PDF viewer | sidebar layout.

import { PulseBlock } from '@/src/shared/components/pulse-block';
import { DashboardCard } from '@/src/shared/components/dashboard-card';
import { CarouselSkeleton } from '@/src/shared/components/carousel-skeleton';
import { ProfileSkeleton } from '@/src/shared/components/profile-skeleton';

/** 5 stat cards matching reviewer-style dimensions */
export function StatsSkeleton() {
  return (
    <>
      <PulseBlock className="h-6 w-44 mb-6" />
      <div className="grid grid-cols-5 gap-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="dashboard-stat-card">
            <PulseBlock className="h-8 w-12 mx-auto mb-2" />
            <PulseBlock className="h-4 w-20 mx-auto" />
          </div>
        ))}
      </div>
    </>
  );
}

// Hoisted style constants for ThreeColumnSkeleton (avoid re-creation per render).
const headerStyle = {
  height: 44,
  borderBottom: '1px solid rgba(120,110,95,0.15)',
} as const;
const bodyStyle = { height: 'calc(100vh - 56px - 44px)' } as const;
const listColStyle = {
  width: 360,
  borderRight: '1px solid rgba(120,110,95,0.15)',
} as const;
const sidebarColStyle = {
  width: 320,
  borderLeft: '1px solid rgba(120,110,95,0.15)',
} as const;
const sidebarHeaderStyle = {
  borderBottom: '1px solid rgba(120,110,95,0.12)',
} as const;

/** Three-column skeleton for content pages: paper list | PDF viewer | sidebar.
 *  Used by incoming, under-review, and accepted loading states. */
export function ThreeColumnSkeleton({
  paperCount = 3,
  sidebarBlocks = ['180px', '150px'],
}: {
  paperCount?: number;
  sidebarBlocks?: string[];
} = {}) {
  return (
    <div>
      {/* Header strip skeleton */}
      <div
        className="flex items-center justify-between px-5"
        style={headerStyle}
      >
        <PulseBlock className="h-3 w-28" />
        <PulseBlock className="h-3 w-16" />
      </div>

      <div className="flex" style={bodyStyle}>
        {/* Paper list column */}
        <div style={listColStyle} className="p-4 space-y-3">
          {Array.from({ length: paperCount }).map((_, i) => (
            <PulseBlock key={i} className="h-[100px]" />
          ))}
        </div>
        {/* PDF viewer column */}
        <div className="flex-1 p-8">
          <PulseBlock className="h-full" />
        </div>
        {/* Sidebar column */}
        <div style={sidebarColStyle}>
          <div className="px-4 py-3" style={sidebarHeaderStyle}>
            <PulseBlock className="h-2.5 w-16" />
          </div>
          <div className="p-4 space-y-3">
            {sidebarBlocks.map((h, i) => (
              <div key={i} style={{ height: h }}>
                <PulseBlock className="h-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Full dashboard skeleton matching the 3-column grid layout */
export function DashboardSkeleton() {
  return (
    <>
      <PulseBlock className="h-8 w-48 mb-8" />
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-8">
          <DashboardCard>
            <StatsSkeleton />
          </DashboardCard>
          <DashboardCard>
            <CarouselSkeleton />
          </DashboardCard>
        </div>
        <div>
          <ProfileSkeleton />
        </div>
      </div>
    </>
  );
}
