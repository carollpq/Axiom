"use client";

import { useState, useMemo } from "react";
import type { DashboardTab, PaperStatus } from "@/types/dashboard";
import {
  mockPapers,
  mockPendingActions,
  mockActivity,
  mockStats,
  paperStatuses,
} from "@/lib/mock-data/dashboard";

export function useDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("papers");
  const [statusFilter, setStatusFilter] = useState<"All" | PaperStatus>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const filteredPapers = useMemo(() => {
    return mockPapers.filter((p) => {
      const matchesStatus =
        statusFilter === "All" || p.status === statusFilter;
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        p.title.toLowerCase().includes(query) ||
        p.coauthors.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [statusFilter, searchQuery]);

  const tabs = [
    { key: "papers" as const, label: "Papers", count: mockPapers.length },
    { key: "pending" as const, label: "Pending Actions", count: mockPendingActions.length },
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
    papers: mockPapers,
    pendingActions: mockPendingActions,
    activity: mockActivity,
    stats: mockStats,
    paperStatuses,
  };
}
