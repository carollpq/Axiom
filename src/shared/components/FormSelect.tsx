"use client";

import type { SelectHTMLAttributes } from "react";

type FormSelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function FormSelect({ className = "", style, children, ...rest }: FormSelectProps) {
  return (
    <select
      className={`rounded-[6px] px-3 py-2 text-[12px] font-serif text-[#d4ccc0] outline-none cursor-pointer ${className}`}
      style={{
        background: "rgba(30,28,24,0.6)",
        border: "1px solid rgba(120,110,95,0.2)",
        appearance: "none",
        ...style,
      }}
      {...rest}
    >
      {children}
    </select>
  );
}
