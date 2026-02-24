"use client";

import { useState, useMemo } from "react";
import { PapersTable } from "./PapersTable";
import { paperStatuses } from "@/src/features/author/mock-data/dashboard";
import type { Paper, PaperStatus } from "@/src/features/author/types/dashboard";

interface Props {
  initialPapers: Paper[];
}

export function PapersTableClient({ initialPapers }: Props) {
  const [statusFilter, setStatusFilter] = useState<"All" | PaperStatus>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

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
      statuses={paperStatuses}
      statusFilter={statusFilter}
      onStatusFilter={setStatusFilter}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      hoveredRow={hoveredRow}
      onHoverRow={setHoveredRow}
    />
  );
}
