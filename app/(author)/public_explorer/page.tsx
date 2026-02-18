"use client";

import { useExplorer } from "@/hooks/useExplorer";
import { ExplorerList, PaperDetail } from "@/components/explorer";

export default function PaperExplorer() {
  const {
    search, setSearch,
    statusFilter, setStatusFilter,
    fieldFilter, setFieldFilter,
    sortBy, setSortBy,
    statuses, fields, filtered,
    paper, detailTab, setDetailTab,
    selectPaper, clearSelection,
  } = useExplorer();

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
