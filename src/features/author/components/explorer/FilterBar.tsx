"use client";

import { FilterPills } from "@/src/shared/components/FilterPills";
import type { SortOption } from "@/src/features/author/types/explorer";

interface FilterBarProps {
  statuses: string[];
  fields: string[];
  studyTypes: string[];
  statusFilter: string;
  fieldFilter: string;
  studyTypeFilter: string;
  sortBy: SortOption;
  onStatusFilter: (s: string) => void;
  onFieldFilter: (f: string) => void;
  onStudyTypeFilter: (s: string) => void;
  onSort: (s: SortOption) => void;
}

export function FilterBar({
  statuses, fields, studyTypes,
  statusFilter, fieldFilter, studyTypeFilter, sortBy,
  onStatusFilter, onFieldFilter, onStudyTypeFilter, onSort,
}: FilterBarProps) {
  return (
    <div className="flex justify-between items-start mb-5 flex-wrap gap-3">
      <div className="flex flex-col gap-2">
        {/* Status + Field in one row */}
        <div className="flex gap-1.5 flex-wrap">
          <FilterPills options={statuses} value={statusFilter} onChange={onStatusFilter} />
          <span className="w-px mx-1" style={{ background: "rgba(120,110,95,0.15)" }} />
          <FilterPills options={fields} value={fieldFilter} onChange={onFieldFilter} />
        </div>
        {/* Study type row */}
        <div className="flex gap-1.5 flex-wrap">
          <FilterPills options={studyTypes} value={studyTypeFilter} onChange={onStudyTypeFilter} />
        </div>
      </div>

      {/* Sort toggle */}
      <div className="flex gap-1">
        {(["newest", "oldest"] as const).map((s) => (
          <button
            key={s}
            onClick={() => onSort(s)}
            className="rounded-sm py-1 px-2.5 text-[10px] font-serif cursor-pointer capitalize"
            style={{
              background: sortBy === s ? "rgba(120,110,95,0.2)" : "transparent",
              border: "1px solid rgba(120,110,95,0.12)",
              color: sortBy === s ? "#c9b89e" : "#4a4238",
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
