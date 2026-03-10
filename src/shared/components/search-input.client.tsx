'use client';

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}: SearchInputProps) {
  return (
    <div className={`relative${className ? ` ${className}` : ''}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full py-2.5 pr-4 pl-10 rounded-[6px] text-[#d4ccc0] font-serif text-[13px] outline-none box-border"
        style={{
          background: 'rgba(45,42,38,0.6)',
          border: '1px solid rgba(120,110,95,0.25)',
        }}
      />
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6a6050] text-base">
        {'\u2315'}
      </span>
    </div>
  );
}
