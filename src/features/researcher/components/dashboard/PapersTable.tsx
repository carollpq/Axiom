"use client";

import { useMemo, useState } from "react";
import { SearchInput } from "@/src/shared/components/SearchInput";
import { FilterPills } from "@/src/shared/components/FilterPills";
import { StatusBadge } from "./StatusBadge";
import { PAPER_STATUSES } from "@/src/features/researcher/types/dashboard";
import type { PaperRow, PaperStatus } from "@/src/features/researcher/types/dashboard";

interface Props {
  initialPapers: PaperRow[];
}

export function PapersTable({ initialPapers }: Props) {
  const [statusFilter, setStatusFilter] = useState<"All" | PaperStatus>("All");
  const [searchQuery, setSearchQuery] = useState("");

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

  const allStatuses: readonly ("All" | PaperStatus)[] = ["All", ...PAPER_STATUSES];

  return (
    <div>
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search papers by title or co-author..."
        className="mb-4"
      />

      <div className="flex gap-1.5 mb-5 flex-wrap">
        <FilterPills<"All" | PaperStatus>
          options={allStatuses}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      {/* Table */}
      <div className="border border-[rgba(120,110,95,0.15)] rounded-[6px] overflow-hidden">
        {/* Header */}
        <div
          className="grid px-5 py-3 bg-[rgba(45,42,38,0.5)] border-b border-[rgba(120,110,95,0.15)] text-[10px] text-[#6a6050] uppercase tracking-[1.5px]"
          style={{ gridTemplateColumns: "2.5fr 1fr 1fr 0.8fr 0.8fr" }}
        >
          <span>Title</span>
          <span>Status</span>
          <span>Co-authors</span>
          <span>Registered</span>
          <span>On-Chain</span>
        </div>

        {/* Rows */}
        {filteredPapers.map((p, i) => (
          <div
            key={p.id}
            className="grid px-5 py-3.5 items-center cursor-pointer transition-colors duration-200 hover:bg-[rgba(120,110,95,0.08)]"
            style={{
              gridTemplateColumns: "2.5fr 1fr 1fr 0.8fr 0.8fr",
              borderBottom: i < filteredPapers.length - 1 ? "1px solid rgba(120,110,95,0.08)" : "none",
            }}
          >
            <span className="text-[13px] text-[#d4ccc0] leading-[1.4] pr-4">{p.title}</span>
            <span><StatusBadge status={p.status} /></span>
            <span className="text-xs text-[#8a8070]">{p.coauthors}</span>
            <span className="text-xs text-[#6a6050]">{p.date}</span>
            <span className="text-[11px] text-[#5a7a9a] font-mono cursor-pointer">{p.hash}</span>
          </div>
        ))}

        {/* Empty State */}
        {filteredPapers.length === 0 && (
          <div className="p-10 text-center text-[#6a6050] italic">
            No papers match this filter
          </div>
        )}
      </div>
    </div>
  );
}
