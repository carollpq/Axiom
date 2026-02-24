import type { BadgeColorConfig } from "@/src/shared/types/shared";

interface BadgeProps {
  label: string;
  colors: BadgeColorConfig;
}

export function Badge({ label, colors }: BadgeProps) {
  return (
    <span
      className="px-2.5 py-0.5 rounded-[3px] text-[11px] tracking-[0.5px] font-serif whitespace-nowrap"
      style={{
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      {label}
    </span>
  );
}
