import type { ExplorerPaper, SortOption } from "@/features/author/types/explorer";
import { SearchBar } from "./SearchBar";
import { FilterBar } from "./FilterBar";
import { PaperCard } from "./PaperCard";

interface ExplorerListProps {
  search: string;
  statusFilter: string;
  fieldFilter: string;
  sortBy: SortOption;
  statuses: string[];
  fields: string[];
  filtered: ExplorerPaper[];
  onSearchChange: (v: string) => void;
  onStatusFilter: (s: string) => void;
  onFieldFilter: (f: string) => void;
  onSort: (s: SortOption) => void;
  onSelectPaper: (id: number) => void;
}

export function ExplorerList({
  search, statusFilter, fieldFilter, sortBy, statuses, fields, filtered,
  onSearchChange, onStatusFilter, onFieldFilter, onSort, onSelectPaper,
}: ExplorerListProps) {
  return (
    <div className="max-w-[1000px] mx-auto py-8 px-10">
      <div className="mb-7">
        <h1 className="text-[28px] font-normal italic text-[#e8e0d4] m-0">Explore Papers</h1>
        <p className="text-[13px] text-[#6a6050] mt-1.5 italic m-0">Discover verified research with on-chain provenance</p>
      </div>

      <SearchBar search={search} onSearchChange={onSearchChange} />

      <FilterBar
        statuses={statuses} fields={fields}
        statusFilter={statusFilter} fieldFilter={fieldFilter} sortBy={sortBy}
        onStatusFilter={onStatusFilter} onFieldFilter={onFieldFilter} onSort={onSort}
      />

      <div className="flex flex-col gap-2.5">
        {filtered.map(p => (
          <PaperCard key={p.id} paper={p} onSelect={onSelectPaper} />
        ))}
        {filtered.length === 0 && (
          <div className="p-10 text-center text-[#6a6050] italic">No papers match your search</div>
        )}
      </div>
    </div>
  );
}
