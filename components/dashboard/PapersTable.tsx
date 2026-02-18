"use client";

import type { Paper, PaperStatus } from "@/types/dashboard";
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
  papers: Paper[];
  statuses: PaperStatus[];
  statusFilter: "All" | PaperStatus;
  onStatusFilter: (s: "All" | PaperStatus) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  hoveredRow: number | null;
  onHoverRow: (id: number | null) => void;
}) {
  const allStatuses: ("All" | PaperStatus)[] = ["All", ...statuses];

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search papers by title or co-author..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full py-2.5 px-4 pl-10 bg-[rgba(45,42,38,0.6)] border border-[rgba(120,110,95,0.25)] rounded-[6px] text-[#d4ccc0] font-serif text-[13px] outline-none"
        />
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6a6050] text-base">
          {"\u2315"}
        </span>
      </div>

      {/* Status Filter Pills */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {allStatuses.map((s) => (
          <button
            key={s}
            onClick={() => onStatusFilter(s)}
            className="rounded-[3px] px-3.5 py-[5px] text-[11px] font-serif cursor-pointer transition-all duration-300 border"
            style={{
              background: statusFilter === s ? "rgba(180,160,120,0.15)" : "transparent",
              borderColor: statusFilter === s ? "rgba(180,160,120,0.3)" : "rgba(120,110,95,0.15)",
              color: statusFilter === s ? "#c9b89e" : "#6a6050",
            }}
          >
            {s}
          </button>
        ))}
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
