'use client';

const COMPACT_STYLE = {
  background: 'rgba(30,28,24,0.6)',
  border: '1px solid rgba(120,110,95,0.2)',
} as const;

const NORMAL_STYLE = {
  background: 'rgba(45,42,38,0.6)',
  border: '1px solid rgba(120,110,95,0.25)',
} as const;

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className,
  compact = false,
}: SearchInputProps) {
  const cls = className ? ` ${className}` : '';

  const input = (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={
        compact
          ? `w-full px-3 py-2 rounded text-[#d4ccc0] font-serif text-xs outline-none box-border${cls}`
          : 'w-full py-2.5 pr-4 pl-10 rounded-[6px] text-[#d4ccc0] font-serif text-[13px] outline-none box-border'
      }
      style={compact ? COMPACT_STYLE : NORMAL_STYLE}
    />
  );

  if (compact) return input;

  return (
    <div className={`relative${cls}`}>
      {input}
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6a6050] text-base">
        {'\u2315'}
      </span>
    </div>
  );
}
