"use client";

import type { TextareaHTMLAttributes } from "react";

type FormTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function FormTextarea({ className = "", style, ...rest }: FormTextareaProps) {
  return (
    <textarea
      className={`w-full rounded-[6px] p-3 text-[12px] font-serif text-[#d4ccc0] outline-none resize-none ${className}`}
      style={{
        background: "rgba(30,28,24,0.6)",
        border: "1px solid rgba(120,110,95,0.2)",
        ...style,
      }}
      {...rest}
    />
  );
}
