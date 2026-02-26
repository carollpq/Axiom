"use client";

import { SearchInput } from "@/src/shared/components/SearchInput";

interface SearchBarProps {
  search: string;
  onSearchChange: (v: string) => void;
}

export function SearchBar({ search, onSearchChange }: SearchBarProps) {
  return (
    <SearchInput
      value={search}
      onChange={onSearchChange}
      placeholder="Search by title, author, ORCID, or paper hash..."
      className="mb-5"
    />
  );
}
