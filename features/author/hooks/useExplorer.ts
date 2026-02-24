"use client";

import { useState, useMemo } from "react";
import type { DetailTab, SortOption, ExplorerPaper } from "@/features/author/types/explorer";
import { FILTER_STATUSES } from "@/features/author/mock-data/explorer";

export function useExplorer(initialPapers: ExplorerPaper[]) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [fieldFilter, setFieldFilter] = useState("All");
  const [selectedPaper, setSelectedPaper] = useState<number | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const papers = initialPapers;

  const fields = useMemo(
    () => ["All", ...new Set(papers.map((p) => p.field))],
    [papers],
  );

  const filtered = useMemo(() => {
    const result = papers.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.abstract.toLowerCase().includes(q) ||
        p.authors.some(
          (a) => a.name.toLowerCase().includes(q) || a.orcid.includes(q),
        ) ||
        p.paperHash.includes(q);
      const matchStatus = statusFilter === "All" || p.status === statusFilter;
      const matchField = fieldFilter === "All" || p.field === fieldFilter;
      return matchSearch && matchStatus && matchField;
    });

    result.sort((a, b) =>
      sortBy === "newest"
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date),
    );

    return result;
  }, [papers, search, statusFilter, fieldFilter, sortBy]);

  const paper = papers.find((p) => p.id === selectedPaper);

  const selectPaper = (id: number) => {
    setSelectedPaper(id);
    setDetailTab("overview");
  };

  const clearSelection = () => setSelectedPaper(null);

  return {
    search, setSearch,
    statusFilter, setStatusFilter,
    fieldFilter, setFieldFilter,
    sortBy, setSortBy,
    statuses: FILTER_STATUSES,
    fields,
    filtered,
    selectedPaper,
    paper,
    detailTab, setDetailTab,
    selectPaper,
    clearSelection,
  };
}
