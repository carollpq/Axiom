"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { StatCard, TabBar } from "@/components/shared";
import { QuickActions } from "./QuickActions";
import { PapersTable } from "./PapersTable";
import { PendingActionsList } from "./PendingActionsList";
import { ActivityFeed } from "./ActivityFeed";
import type {
  Paper,
  StatCardData,
  PendingAction,
  ActivityItem,
} from "@/types/dashboard";

interface DashboardClientProps {
  initialPapers: Paper[];
  initialStats: StatCardData[];
  initialPendingActions: PendingAction[];
  initialActivity: ActivityItem[];
}

export function DashboardClient({
  initialPapers,
  initialStats,
  initialPendingActions,
  initialActivity,
}: DashboardClientProps) {
  const {
    activeTab,
    setActiveTab,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    hoveredRow,
    setHoveredRow,
    filteredPapers,
    tabs,
    pendingActions,
    activity,
    stats,
    paperStatuses,
  } = useDashboard(initialPapers, initialStats, initialPendingActions, initialActivity);

  return (
    <div className="max-w-[1200px] mx-auto px-10 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-normal italic text-[#e8e0d4] m-0 tracking-[0.5px]">
          Author Dashboard
        </h1>
        <p className="text-[13px] text-[#6a6050] mt-1.5 italic">
          Manage your research, contracts, and submissions
        </p>
      </div>

      {/* Stat Cards */}
      <div className="flex gap-4 mb-8 flex-wrap">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Tabs */}
      <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === "papers" && (
        <PapersTable
          papers={filteredPapers}
          statuses={paperStatuses}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          hoveredRow={hoveredRow}
          onHoverRow={setHoveredRow}
        />
      )}

      {activeTab === "pending" && (
        <PendingActionsList actions={pendingActions} />
      )}

      {activeTab === "activity" && (
        <ActivityFeed items={activity} />
      )}
    </div>
  );
}
