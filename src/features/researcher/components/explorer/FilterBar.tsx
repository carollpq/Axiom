"use client";

import type { SortOption } from "@/src/features/researcher/types/explorer";

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

function FilterSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const isActive = value !== "All";

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none rounded-[3px] py-[5px] pl-3 pr-7 text-[11px] font-serif cursor-pointer transition-all duration-300 outline-none"
      style={{
        background: isActive ? "rgba(180,160,120,0.15)" : "rgba(45,42,38,0.5)",
        border: `1px solid ${isActive ? "rgba(180,160,120,0.3)" : "rgba(120,110,95,0.15)"}`,
        color: isActive ? "#c9b89e" : "#6a6050",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236a6050' stroke-width='1.2' fill='none'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 8px center",
      }}
      aria-label={label}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt === "All" ? `${label}` : opt}
        </option>
      ))}
    </select>
  );
}

export function FilterBar({
  statuses, fields, studyTypes,
  statusFilter, fieldFilter, studyTypeFilter, sortBy,
  onStatusFilter, onFieldFilter, onStudyTypeFilter, onSort,
}: FilterBarProps) {
  return (
    <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
      <div className="flex gap-2">
        <FilterSelect label="Status" options={statuses} value={statusFilter} onChange={onStatusFilter} />
        <FilterSelect label="Field" options={fields} value={fieldFilter} onChange={onFieldFilter} />
        <FilterSelect label="Study Type" options={studyTypes} value={studyTypeFilter} onChange={onStudyTypeFilter} />
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
