"use client";

import { useState, useMemo } from "react";
import type { DetailTab, SortOption } from "@/types/explorer";
import { mockPapersExplorer, FILTER_STATUSES } from "@/lib/mock-data/explorer";

export function useExplorer() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [fieldFilter, setFieldFilter] = useState("All");
  const [selectedPaper, setSelectedPaper] = useState<number | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const fields = useMemo(
    () => ["All", ...new Set(mockPapersExplorer.map(p => p.field))],
    [],
  );

  const filtered = useMemo(() => {
    const result = mockPapersExplorer.filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q
        || p.title.toLowerCase().includes(q)
        || p.abstract.toLowerCase().includes(q)
        || p.authors.some(a => a.name.toLowerCase().includes(q) || a.orcid.includes(q))
        || p.paperHash.includes(q);
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
  }, [search, statusFilter, fieldFilter, sortBy]);

  const paper = mockPapersExplorer.find(p => p.id === selectedPaper);

  const selectPaper = (id: number) => {
    setSelectedPaper(id);
    setDetailTab("overview");
  };

  const clearSelection = () => setSelectedPaper(null);

  return {
    // Search & filters
    search, setSearch,
    statusFilter, setStatusFilter,
    fieldFilter, setFieldFilter,
    sortBy, setSortBy,
    statuses: FILTER_STATUSES,
    fields,
    filtered,
    // Detail
    selectedPaper,
    paper,
    detailTab, setDetailTab,
    selectPaper,
    clearSelection,
  };
}
