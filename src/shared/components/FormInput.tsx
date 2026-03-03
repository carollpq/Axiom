"use client";

import type { InputHTMLAttributes } from "react";

type FormInputProps = InputHTMLAttributes<HTMLInputElement>;

export function FormInput({ className = "", style, ...rest }: FormInputProps) {
  return (
    <input
      className={`w-full rounded text-[12px] font-serif text-[#d4ccc0] outline-none ${className}`}
      style={{
        padding: "7px 10px",
        background: "rgba(30,28,24,0.8)",
        border: "1px solid rgba(120,110,95,0.25)",
        boxSizing: "border-box",
        ...style,
      }}
      {...rest}
    />
  );
}
