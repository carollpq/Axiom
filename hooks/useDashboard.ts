"use client";

import { useState, useMemo } from "react";
import type {
  DashboardTab,
  PaperStatus,
  Paper,
  PendingAction,
  ActivityItem,
  StatCardData,
} from "@/types/dashboard";
import { paperStatuses } from "@/lib/mock-data/dashboard";

export function useDashboard(
  initialPapers: Paper[],
  initialStats: StatCardData[],
  initialPendingActions: PendingAction[],
  initialActivity: ActivityItem[],
) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("papers");
  const [statusFilter, setStatusFilter] = useState<"All" | PaperStatus>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const filteredPapers = useMemo(() => {
    return initialPapers.filter((p) => {
      const matchesStatus =
        statusFilter === "All" || p.status === statusFilter;
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        p.title.toLowerCase().includes(query) ||
        p.coauthors.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [initialPapers, statusFilter, searchQuery]);

  const tabs = [
    { key: "papers" as const, label: "Papers", count: initialPapers.length },
    {
      key: "pending" as const,
      label: "Pending Actions",
      count: initialPendingActions.length,
    },
    { key: "activity" as const, label: "Recent Activity", count: null },
  ];

  return {
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
    papers: initialPapers,
    pendingActions: initialPendingActions,
    activity: initialActivity,
    stats: initialStats,
    paperStatuses,
  };
}
