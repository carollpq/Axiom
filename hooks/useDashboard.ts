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
import {
  mockPapers,
  mockPendingActions,
  mockActivity,
  mockStats,
  paperStatuses,
} from "@/lib/mock-data/dashboard";
import { fetchApi } from "@/lib/api";
import { toDisplayStatus } from "@/lib/status-map";
import type { ApiPaper } from "@/types/api";
import { useAuthFetch } from "@/hooks/useAuthFetch";

function mapDbPaperToFrontend(p: ApiPaper, index: number): Paper {
  const coauthors =
    p.contracts
      ?.flatMap((c) => c.contributors ?? [])
      .map((c) => c.contributorName)
      .filter(Boolean)
      .join(", ") || "\u2014";

  const hash = p.versions?.[0]?.paperHash ?? "\u2014";
  const truncatedHash =
    hash.length > 12
      ? `${hash.slice(0, 6)}...${hash.slice(-4)}`
      : hash;

  return {
    id: index + 1,
    title: p.title,
    status: toDisplayStatus(p.status),
    coauthors,
    date: p.createdAt.slice(0, 10),
    hash: truncatedHash,
  };
}

function computeStats(papers: Paper[]): StatCardData[] {
  const total = papers.length;
  const pending = papers.filter((p) => p.status === "Contract Pending").length;
  const review = papers.filter((p) => p.status === "Under Review").length;
  const published = papers.filter((p) => p.status === "Published").length;

  return [
    { label: "Total Papers", value: String(total), icon: "\uD83D\uDCDC" },
    { label: "Pending Contracts", value: String(pending), icon: "\u270D" },
    { label: "Under Review", value: String(review), icon: "\u23F3" },
    { label: "Published", value: String(published), icon: "\u2726" },
  ];
}

export function useDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("papers");
  const [statusFilter, setStatusFilter] = useState<"All" | PaperStatus>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const { data: dashboardData, loading } = useAuthFetch(
    async (wallet) => {
      const [papersData, activityData] = await Promise.all([
        fetchApi<ApiPaper[]>(`/api/papers?wallet=${wallet}`),
        fetchApi<{ pendingActions: PendingAction[]; activity: ActivityItem[] }>(
          `/api/activity?wallet=${wallet}`,
        ),
      ]);
      return { papersData, activityData };
    },
    [],
  );

  const dbPapers = dashboardData
    ? dashboardData.papersData.map(mapDbPaperToFrontend)
    : null;
  const dbPendingActions = dashboardData?.activityData.pendingActions ?? null;
  const dbActivity = dashboardData?.activityData.activity ?? null;

  // Use DB data when available, fall back to mock
  const papers = dbPapers ?? mockPapers;
  const stats = dbPapers ? computeStats(dbPapers) : mockStats;

  const filteredPapers = useMemo(() => {
    return papers.filter((p) => {
      const matchesStatus =
        statusFilter === "All" || p.status === statusFilter;
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        p.title.toLowerCase().includes(query) ||
        p.coauthors.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [papers, statusFilter, searchQuery]);

  const pendingActions = dbPendingActions ?? mockPendingActions;
  const activity = dbActivity ?? mockActivity;

  const tabs = [
    { key: "papers" as const, label: "Papers", count: papers.length },
    {
      key: "pending" as const,
      label: "Pending Actions",
      count: pendingActions.length,
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
    papers,
    pendingActions,
    activity,
    stats,
    paperStatuses,
    loading,
  };
}
