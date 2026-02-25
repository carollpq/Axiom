"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { ExplorerPaper, SortOption } from "@/src/features/author/types/explorer";
import { SearchBar } from "./SearchBar";
import { FilterBar } from "./FilterBar";
import { PaperCard } from "./PaperCard";

const FILTER_STATUSES = ["All", "Published", "Under Review", "Retracted"];
const STUDY_TYPES = ["All", "Original", "Negative Result", "Replication", "Meta-Analysis"];

interface ExplorerShellProps {
  initialPapers: ExplorerPaper[];
}

export function ExplorerShell({ initialPapers }: ExplorerShellProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [fieldFilter, setFieldFilter] = useState("All");
  const [studyTypeFilter, setStudyTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const fields = useMemo(
    () => ["All", ...new Set(initialPapers.map((p) => p.field))],
    [initialPapers],
  );

  const filtered = useMemo(() => {
    const result = initialPapers.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.abstract.toLowerCase().includes(q) ||
        p.authors.some(
          (a) => a.name.toLowerCase().includes(q) || a.orcid.includes(q),
        ) ||
        p.paperHash.includes(q);
      const matchStatus = statusFilter === "All" || p.status === statusFilter;
      const matchField = fieldFilter === "All" || p.field === fieldFilter;
      const normalizedStudyType = p.studyType
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .replace("Meta Analysis", "Meta-Analysis");
      const matchStudyType =
        studyTypeFilter === "All" || normalizedStudyType === studyTypeFilter;
      return matchSearch && matchStatus && matchField && matchStudyType;
    });

    result.sort((a, b) =>
      sortBy === "newest"
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date),
    );

    return result;
  }, [initialPapers, search, statusFilter, fieldFilter, studyTypeFilter, sortBy]);

  const handleSelectPaper = (id: string) => {
    router.push(`?paper=${id}`);
  };

  return (
    <>
      <SearchBar search={search} onSearchChange={setSearch} />

      <FilterBar
        statuses={FILTER_STATUSES}
        fields={fields}
        studyTypes={STUDY_TYPES}
        statusFilter={statusFilter}
        fieldFilter={fieldFilter}
        studyTypeFilter={studyTypeFilter}
        sortBy={sortBy}
        onStatusFilter={setStatusFilter}
        onFieldFilter={setFieldFilter}
        onStudyTypeFilter={setStudyTypeFilter}
        onSort={setSortBy}
      />

      <div className="flex flex-col gap-2.5">
        {filtered.map((p) => (
          <PaperCard key={p.id} paper={p} onSelect={handleSelectPaper} />
        ))}
        {filtered.length === 0 && (
          <div className="p-10 text-center text-[#6a6050] italic">
            No papers match your search
          </div>
        )}
      </div>
    </>
  );
}
