"use client";

import { useState, useMemo } from "react";
import { PapersTable } from "./PapersTable";
import { PAPER_STATUSES } from "@/src/features/researcher/types/dashboard";
import type { PaperRow, PaperStatus } from "@/src/features/researcher/types/dashboard";

interface Props {
  initialPapers: PaperRow[];
}

export function PapersTableClient({ initialPapers }: Props) {
  const [statusFilter, setStatusFilter] = useState<"All" | PaperStatus>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const filteredPapers = useMemo(() => {
    return initialPapers.filter((p) => {
      const matchesStatus = statusFilter === "All" || p.status === statusFilter;
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        p.title.toLowerCase().includes(query) ||
        p.coauthors.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [initialPapers, statusFilter, searchQuery]);

  return (
    <PapersTable
      papers={filteredPapers}
      statuses={PAPER_STATUSES}
      statusFilter={statusFilter}
      onStatusFilter={setStatusFilter}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      hoveredRow={hoveredRow}
      onHoverRow={setHoveredRow}
    />
  );
}
