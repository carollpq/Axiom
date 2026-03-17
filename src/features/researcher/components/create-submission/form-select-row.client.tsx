'use client';

import type { ReactNode } from 'react';

const SELECT_STYLE = {
  background: 'rgba(35,32,28,0.8)',
  border: '1px solid rgba(120,110,95,0.2)',
} as const;

interface FormSelectRowProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder: string;
  children: ReactNode;
  style?: React.CSSProperties;
  'data-testid'?: string;
}

export function FormSelectRow({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  children,
  style,
  'data-testid': testId,
}: FormSelectRowProps) {
  return (
    <div className="flex items-center gap-6 mb-5" data-testid={testId}>
      <label className="text-[13px] text-[#b0a898] w-[200px] shrink-0">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="flex-1 px-3 py-2.5 rounded-md text-[13px] font-serif text-[#d4ccc0] cursor-pointer"
        style={{ ...SELECT_STYLE, ...style }}
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
    </div>
  );
}
