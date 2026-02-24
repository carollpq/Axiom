"use client";

import { useExplorer } from "@/features/author/hooks/useExplorer";
import { ExplorerList } from "./ExplorerList";
import { PaperDetail } from "./PaperDetail";
import type { ExplorerPaper } from "@/features/author/types/explorer";

interface ExplorerClientProps {
  initialPapers: ExplorerPaper[];
}

export function ExplorerClient({ initialPapers }: ExplorerClientProps) {
  const {
    search, setSearch,
    statusFilter, setStatusFilter,
    fieldFilter, setFieldFilter,
    sortBy, setSortBy,
    statuses, fields, filtered,
    paper, detailTab, setDetailTab,
    selectPaper, clearSelection,
  } = useExplorer(initialPapers);

  if (paper) {
    return (
      <PaperDetail
        paper={paper}
        detailTab={detailTab}
        onTabChange={setDetailTab}
        onBack={clearSelection}
      />
    );
  }

  return (
    <ExplorerList
      search={search}
      statusFilter={statusFilter}
      fieldFilter={fieldFilter}
      sortBy={sortBy}
      statuses={statuses}
      fields={fields}
      filtered={filtered}
      onSearchChange={setSearch}
      onStatusFilter={setStatusFilter}
      onFieldFilter={setFieldFilter}
      onSort={setSortBy}
      onSelectPaper={selectPaper}
    />
  );
}
