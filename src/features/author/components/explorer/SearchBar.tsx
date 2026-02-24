"use client";

interface SearchBarProps {
  search: string;
  onSearchChange: (v: string) => void;
}

export function SearchBar({ search, onSearchChange }: SearchBarProps) {
  return (
    <div className="relative mb-5">
      <input
        type="text"
        placeholder="Search by title, author, ORCID, or paper hash..."
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        className="w-full py-3.5 pr-[18px] pl-[42px] rounded-md text-[#d4ccc0] font-serif text-sm outline-none box-border"
        style={{ background: "rgba(45,42,38,0.6)", border: "1px solid rgba(120,110,95,0.25)" }}
      />
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6a6050] text-base">{"\u2315"}</span>
    </div>
  );
}
