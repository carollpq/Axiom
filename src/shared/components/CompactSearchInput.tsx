"use client";

interface CompactSearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export function CompactSearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className,
}: CompactSearchInputProps) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 rounded text-[#d4ccc0] font-serif text-xs outline-none box-border${className ? ` ${className}` : ""}`}
      style={{
        background: "rgba(30,28,24,0.6)",
        border: "1px solid rgba(120,110,95,0.2)",
      }}
    />
  );
}
