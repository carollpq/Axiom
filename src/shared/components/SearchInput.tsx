"use client";

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** md (default) — with magnifier icon, standard padding.
   *  sm — compact, no icon (used in dense panels). */
  size?: "md" | "sm";
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  size = "md",
  className,
}: SearchInputProps) {
  if (size === "sm") {
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

  return (
    <div className={`relative${className ? ` ${className}` : ""}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full py-2.5 pr-4 pl-10 rounded-[6px] text-[#d4ccc0] font-serif text-[13px] outline-none box-border"
        style={{
          background: "rgba(45,42,38,0.6)",
          border: "1px solid rgba(120,110,95,0.25)",
        }}
      />
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6a6050] text-base">
        {"\u2315"}
      </span>
    </div>
  );
}
