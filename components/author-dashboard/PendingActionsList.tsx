import type { PendingAction } from "@/types/dashboard";

const typeStyles: Record<PendingAction["type"], { bg: string; color: string; icon: string }> = {
  sign: { bg: "rgba(180,140,100,0.15)", color: "#c4956a", icon: "\u270D" },
  revision: { bg: "rgba(200,130,100,0.15)", color: "#d4845a", icon: "\u21BB" },
  review: { bg: "rgba(130,160,200,0.15)", color: "#7a9fc7", icon: "\u25C9" },
};

export function PendingActionsList({ actions }: { actions: PendingAction[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {actions.map((a, i) => {
        const s = typeStyles[a.type];
        return (
          <div
            key={i}
            className="flex items-start gap-3.5 px-5 py-4 bg-[rgba(45,42,38,0.5)] border border-[rgba(120,110,95,0.15)] rounded-r-[6px]"
            style={{ borderLeft: `3px solid ${a.urgent ? "#c4956a" : "rgba(120,110,95,0.3)"}` }}
          >
            <div
              className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm"
              style={{ background: s.bg, color: s.color }}
            >
              {s.icon}
            </div>
            <div className="flex-1">
              <div className="text-[13px] text-[#d4ccc0] leading-[1.5]">{a.text}</div>
              <div className="text-[11px] text-[#6a6050] mt-1">{a.time}</div>
            </div>
            {a.urgent && (
              <span className="text-[9px] text-[#c4956a] border border-[rgba(180,140,100,0.3)] px-2 py-0.5 rounded-[3px] uppercase tracking-[1px] whitespace-nowrap">
                Action needed
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
