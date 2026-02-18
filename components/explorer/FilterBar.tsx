"use client";

import type { SortOption } from "@/types/explorer";

interface FilterBarProps {
  statuses: string[];
  fields: string[];
  statusFilter: string;
  fieldFilter: string;
  sortBy: SortOption;
  onStatusFilter: (s: string) => void;
  onFieldFilter: (f: string) => void;
  onSort: (s: SortOption) => void;
}

export function FilterBar({ statuses, fields, statusFilter, fieldFilter, sortBy, onStatusFilter, onFieldFilter, onSort }: FilterBarProps) {
  return (
    <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
      <div className="flex gap-1.5 flex-wrap">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => onStatusFilter(s)}
            className="rounded-sm py-1 px-3 text-[11px] font-serif cursor-pointer"
            style={{
              background: statusFilter === s ? "rgba(180,160,120,0.15)" : "transparent",
              border: "1px solid " + (statusFilter === s ? "rgba(180,160,120,0.3)" : "rgba(120,110,95,0.15)"),
              color: statusFilter === s ? "#c9b89e" : "#6a6050",
            }}
          >{s}</button>
        ))}
        <span className="w-px mx-1" style={{ background: "rgba(120,110,95,0.15)" }} />
        {fields.map(f => (
          <button
            key={f}
            onClick={() => onFieldFilter(f)}
            className="rounded-sm py-1 px-3 text-[11px] font-serif cursor-pointer"
            style={{
              background: fieldFilter === f ? "rgba(180,160,120,0.15)" : "transparent",
              border: "1px solid " + (fieldFilter === f ? "rgba(180,160,120,0.3)" : "rgba(120,110,95,0.15)"),
              color: fieldFilter === f ? "#c9b89e" : "#6a6050",
            }}
          >{f}</button>
        ))}
      </div>
      <div className="flex gap-1">
        {(["newest", "oldest"] as const).map(s => (
          <button
            key={s}
            onClick={() => onSort(s)}
            className="rounded-sm py-1 px-2.5 text-[10px] font-serif cursor-pointer capitalize"
            style={{
              background: sortBy === s ? "rgba(120,110,95,0.2)" : "transparent",
              border: "1px solid rgba(120,110,95,0.12)",
              color: sortBy === s ? "#c9b89e" : "#4a4238",
            }}
          >{s}</button>
        ))}
      </div>
    </div>
  );
}
