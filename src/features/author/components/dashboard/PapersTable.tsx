"use client";

import type { PaperRow, PaperStatus } from "@/src/features/author/types/dashboard";
import { SearchInput } from "@/src/shared/components/SearchInput";
import { FilterPills } from "@/src/shared/components/FilterPills";
import { StatusBadge } from "./StatusBadge";

export function PapersTable({
  papers,
  statuses,
  statusFilter,
  onStatusFilter,
  searchQuery,
  onSearchChange,
  hoveredRow,
  onHoverRow,
}: {
  papers: PaperRow[];
  statuses: PaperStatus[];
  statusFilter: "All" | PaperStatus;
  onStatusFilter: (s: "All" | PaperStatus) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  hoveredRow: string | null;
  onHoverRow: (id: string | null) => void;
}) {
  const allStatuses: ("All" | PaperStatus)[] = ["All", ...statuses];

  return (
    <div>
      <SearchInput
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Search papers by title or co-author..."
        className="mb-4"
      />

      <div className="flex gap-1.5 mb-5 flex-wrap">
        <FilterPills
          options={allStatuses}
          value={statusFilter}
          onChange={onStatusFilter}
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
        {papers.map((p, i) => (
          <div
            key={p.id}
            onMouseEnter={() => onHoverRow(p.id)}
            onMouseLeave={() => onHoverRow(null)}
            className="grid px-5 py-3.5 items-center cursor-pointer transition-colors duration-200"
            style={{
              gridTemplateColumns: "2.5fr 1fr 1fr 0.8fr 0.8fr",
              background: hoveredRow === p.id ? "rgba(120,110,95,0.08)" : "transparent",
              borderBottom: i < papers.length - 1 ? "1px solid rgba(120,110,95,0.08)" : "none",
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
        {papers.length === 0 && (
          <div className="p-10 text-center text-[#6a6050] italic">
            No papers match this filter
          </div>
        )}
      </div>
    </div>
  );
}
